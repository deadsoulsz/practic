import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Send, MessageSquare, Calendar } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Event = Database['public']['Tables']['events']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface MessageWithProfile extends Message {
  sender: Profile
}

interface EventWithMessages extends Event {
  messages: MessageWithProfile[]
}

export function Messages() {
  const [events, setEvents] = useState<EventWithMessages[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithMessages | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, profile } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      const interval = setInterval(() => {
        fetchMessages(selectedEvent.id)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [selectedEvent])

  useEffect(() => {
    scrollToBottom()
  }, [selectedEvent?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchUserEvents = async () => {
    try {
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user?.id || '')
        .eq('status', 'registered')

      if (regError) throw regError

      if (registrations.length === 0) {
        setLoading(false)
        return
      }

      const eventIds = registrations.map(r => r.event_id)

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true })

      if (eventsError) throw eventsError

      const eventsWithMessages = await Promise.all(
        eventsData.map(async (event) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq('event_id', event.id)
            .order('created_at', { ascending: true })

          if (messagesError) throw messagesError

          return {
            ...event,
            messages: messagesData as MessageWithProfile[] || []
          }
        })
      )

      setEvents(eventsWithMessages)
      
      if (eventsWithMessages.length > 0 && !selectedEvent) {
        setSelectedEvent(eventsWithMessages[0])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить мероприятия",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (eventId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, messages: messagesData as MessageWithProfile[] || [] }
          : event
      ))

      if (selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? {
          ...prev,
          messages: messagesData as MessageWithProfile[] || []
        } : null)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedEvent || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          event_id: selectedEvent.id,
          sender_id: user?.id || '',
          content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      fetchMessages(selectedEvent.id)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  const getEventTypeLabel = (type: string) => {
    const labels = {
      conference: 'Конференция',
      seminar: 'Семинар',
      workshop: 'Мастер-класс',
      webinar: 'Вебинар',
      networking: 'Нетворкинг'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет доступных чатов</h3>
        <p className="text-gray-500">
          Зарегистрируйтесь на мероприятия, чтобы получить доступ к чатам
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Сообщения</h2>
        <p className="text-gray-600">Общайтесь с участниками мероприятий</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Мои мероприятия</CardTitle>
              <CardDescription>Выберите мероприятие для чата</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                      selectedEvent?.id === event.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm truncate">{event.title}</h3>
                      {event.messages.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {event.messages.length}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(event.date), 'dd MMM', { locale: ru })}</span>
                      <Badge variant="outline" className="text-xs">
                        {getEventTypeLabel(event.event_type)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedEvent ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
                <CardDescription>
                  Чат участников • {selectedEvent.messages.length} сообщений
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {selectedEvent.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Пока нет сообщений</p>
                    <p className="text-sm text-gray-400">Будьте первым, кто напишет!</p>
                  </div>
                ) : (
                  selectedEvent.messages.map((message) => {
                    const isMyMessage = message.sender_id === user?.id
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex space-x-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMyMessage && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.sender?.avatar_url || ''} alt={message.sender?.full_name || ''} />
                            <AvatarFallback className="text-xs">
                              {message.sender?.full_name ? getInitials(message.sender.full_name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-first' : ''}`}>
                          {!isMyMessage && (
                            <div className="text-xs text-gray-500 mb-1">
                              {message.sender?.full_name || 'Аноним'}
                            </div>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              isMyMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content}
                          </div>
                          <div className={`text-xs text-gray-500 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </div>
                        </div>

                        {isMyMessage && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                            <AvatarFallback className="text-xs">
                              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!newMessage.trim() || sending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите мероприятие</h3>
                <p className="text-gray-500">Выберите мероприятие слева для начала общения</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
