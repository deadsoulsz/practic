import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, MapPin, Users, Plus, Clock, Video, Building } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Event = Database['public']['Tables']['events']['Row']
type EventRegistration = Database['public']['Tables']['event_registrations']['Row']

interface EventWithRegistration extends Event {
  registrations_count: number
  is_registered: boolean
}

export function Events() {
  const [events, setEvents] = useState<EventWithRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventWithRegistration | null>(null)
  const { user, profile } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      const eventsWithRegistrations = await Promise.all(
        eventsData.map(async (event) => {
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'registered')

          const { data: userRegistration } = await supabase
            .from('event_registrations')
            .select('*')
            .eq('event_id', event.id)
            .eq('user_id', user?.id || '')
            .eq('status', 'registered')
            .single()

          return {
            ...event,
            registrations_count: count || 0,
            is_registered: !!userRegistration
          }
        })
      )

      setEvents(eventsWithRegistrations)
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

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      event_type: formData.get('event_type') as string,
      format: formData.get('format') as string,
      date: formData.get('date') as string,
      end_date: formData.get('end_date') as string,
      location: formData.get('location') as string,
      max_participants: parseInt(formData.get('max_participants') as string) || null,
      image_url: formData.get('image_url') as string,
      created_by: user?.id
    }

    try {
      const { error } = await supabase
        .from('events')
        .insert(eventData)

      if (error) throw error

      toast({
        title: "Успех!",
        description: "Мероприятие успешно создано",
      })

      setIsCreateDialogOpen(false)
      fetchEvents()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать мероприятие",
        variant: "destructive",
      })
    }
  }

  const handleRegisterForEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user?.id || '',
          status: 'registered'
        })

      if (error) throw error

      toast({
        title: "Успех!",
        description: "Вы успешно зарегистрировались на мероприятие",
      })

      fetchEvents()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось зарегистрироваться",
        variant: "destructive",
      })
    }
  }

  const handleUnregisterFromEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user?.id || '')

      if (error) throw error

      toast({
        title: "Успех!",
        description: "Вы отменили регистрацию на мероприятие",
      })

      fetchEvents()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отменить регистрацию",
        variant: "destructive",
      })
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'conference':
        return <Building className="w-4 h-4" />
      case 'webinar':
        return <Video className="w-4 h-4" />
      case 'workshop':
        return <Users className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
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

  const getFormatLabel = (format: string) => {
    const labels = {
      online: 'Онлайн',
      offline: 'Оффлайн',
      hybrid: 'Гибридный'
    }
    return labels[format as keyof typeof labels] || format
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Мероприятия</h2>
          <p className="text-gray-600">Найдите и участвуйте в профессиональных мероприятиях</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать мероприятие
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новое мероприятие</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_type">Тип мероприятия</Label>
                  <Select name="event_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conference">Конференция</SelectItem>
                      <SelectItem value="seminar">Семинар</SelectItem>
                      <SelectItem value="workshop">Мастер-класс</SelectItem>
                      <SelectItem value="webinar">Вебинар</SelectItem>
                      <SelectItem value="networking">Нетворкинг</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Формат</Label>
                  <Select name="format" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Онлайн</SelectItem>
                      <SelectItem value="offline">Оффлайн</SelectItem>
                      <SelectItem value="hybrid">Гибридный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Макс. участников</Label>
                  <Input id="max_participants" name="max_participants" type="number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Дата начала</Label>
                  <Input id="date" name="date" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Дата окончания</Label>
                  <Input id="end_date" name="end_date" type="datetime-local" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Место проведения</Label>
                <Input id="location" name="location" placeholder="Адрес или ссылка" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL изображения</Label>
                <Input id="image_url" name="image_url" type="url" placeholder="https://..." />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">Создать</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            {event.image_url && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {getEventTypeIcon(event.event_type)}
                  <Badge variant="secondary">
                    {getEventTypeLabel(event.event_type)}
                  </Badge>
                </div>
                <Badge variant={event.format === 'online' ? 'default' : 'outline'}>
                  {getFormatLabel(event.format)}
                </Badge>
              </div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <CardDescription>{event.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(event.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  {event.registrations_count} участников
                  {event.max_participants && ` / ${event.max_participants}`}
                </span>
              </div>

              <div className="flex space-x-2">
                {event.is_registered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnregisterFromEvent(event.id)}
                    className="flex-1"
                  >
                    Отменить участие
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleRegisterForEvent(event.id)}
                    className="flex-1"
                    disabled={event.max_participants !== null && event.registrations_count >= event.max_participants}
                  >
                    Участвовать
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvent(event)}
                >
                  Подробнее
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.image_url && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex space-x-2">
                <Badge variant="secondary">
                  {getEventTypeLabel(selectedEvent.event_type)}
                </Badge>
                <Badge variant={selectedEvent.format === 'online' ? 'default' : 'outline'}>
                  {getFormatLabel(selectedEvent.format)}
                </Badge>
              </div>

              <p className="text-gray-600">{selectedEvent.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {format(new Date(selectedEvent.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>
                    {selectedEvent.registrations_count} участников
                    {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`}
                  </span>
                </div>

                {selectedEvent.end_date && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      до {format(new Date(selectedEvent.end_date), 'HH:mm', { locale: ru })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Закрыть
                </Button>
                {selectedEvent.is_registered ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUnregisterFromEvent(selectedEvent.id)
                      setSelectedEvent(null)
                    }}
                  >
                    Отменить участие
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleRegisterForEvent(selectedEvent.id)
                      setSelectedEvent(null)
                    }}
                    disabled={selectedEvent.max_participants !== null && selectedEvent.registrations_count >= selectedEvent.max_participants}
                  >
                    Участвовать
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
