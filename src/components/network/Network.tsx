import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Search, UserPlus, Check, X, Users, Building, Linkedin } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type NetworkConnection = Database['public']['Tables']['network_connections']['Row']

interface ProfileWithConnection extends Profile {
  connection_status?: string
  connection_id?: string
}

export function Network() {
  const [profiles, setProfiles] = useState<ProfileWithConnection[]>([])
  const [connections, setConnections] = useState<NetworkConnection[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('browse')
  const { user } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchProfiles()
    fetchConnections()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')

      if (error) throw error

      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профили",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('network_connections')
        .select(`
          *,
          requester:profiles!network_connections_requester_id_fkey(*),
          receiver:profiles!network_connections_receiver_id_fkey(*)
        `)
        .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`)

      if (error) throw error

      setConnections(data || [])
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase
        .from('network_connections')
        .insert({
          requester_id: user?.id || '',
          receiver_id: receiverId,
          status: 'pending'
        })

      if (error) throw error

      toast({
        title: "Запрос отправлен",
        description: "Запрос на подключение отправлен",
      })

      fetchConnections()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить запрос",
        variant: "destructive",
      })
    }
  }

  const respondToConnection = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('network_connections')
        .update({ status })
        .eq('id', connectionId)

      if (error) throw error

      toast({
        title: status === 'accepted' ? "Запрос принят" : "Запрос отклонен",
        description: `Запрос на подключение ${status === 'accepted' ? 'принят' : 'отклонен'}`,
      })

      fetchConnections()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обработать запрос",
        variant: "destructive",
      })
    }
  }

  const getConnectionStatus = (profileId: string) => {
    const connection = connections.find(c => 
      (c.requester_id === user?.id && c.receiver_id === profileId) ||
      (c.receiver_id === user?.id && c.requester_id === profileId)
    )
    return connection
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingRequests = connections.filter(c => 
    c.status === 'pending' && c.receiver_id === user?.id
  )

  const acceptedConnections = connections.filter(c => 
    c.status === 'accepted' && (c.requester_id === user?.id || c.receiver_id === user?.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Мои контакты</h2>
        <p className="text-gray-600">Расширяйте профессиональную сеть</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Поиск людей</TabsTrigger>
          <TabsTrigger value="requests">
            Запросы
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">Мои контакты</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по имени, компании или должности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => {
              const connection = getConnectionStatus(profile.id)
              
              return (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                        <AvatarFallback>
                          {profile.full_name ? getInitials(profile.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {profile.full_name || 'Без имени'}
                        </CardTitle>
                        {profile.position && (
                          <CardDescription className="truncate">
                            {profile.position}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.company && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span className="truncate">{profile.company}</span>
                      </div>
                    )}
                    
                    {profile.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    <div className="flex space-x-2">
                      {!connection ? (
                        <Button
                          size="sm"
                          onClick={() => sendConnectionRequest(profile.id)}
                          className="flex-1"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Подключиться
                        </Button>
                      ) : connection.status === 'pending' ? (
                        <Button size="sm" variant="outline" disabled className="flex-1">
                          {connection.requester_id === user?.id ? 'Запрос отправлен' : 'Ожидает ответа'}
                        </Button>
                      ) : connection.status === 'accepted' ? (
                        <Button size="sm" variant="outline" disabled className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Подключены
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => sendConnectionRequest(profile.id)}
                          className="flex-1"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Подключиться
                        </Button>
                      )}
                      
                      {profile.linkedin_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Никого не найдено</h3>
              <p className="text-gray-500">Попробуйте изменить поисковый запрос</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет входящих запросов</h3>
              <p className="text-gray-500">Здесь будут отображаться запросы на подключение</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const requester = connections.find(c => c.id === request.id)?.requester as Profile
                
                return (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={requester?.avatar_url || ''} alt={requester?.full_name || ''} />
                            <AvatarFallback>
                              {requester?.full_name ? getInitials(requester.full_name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{requester?.full_name || 'Без имени'}</h4>
                            {requester?.position && requester?.company && (
                              <p className="text-sm text-gray-600">
                                {requester.position} в {requester.company}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => respondToConnection(request.id, 'accepted')}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Принять
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToConnection(request.id, 'rejected')}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          {acceptedConnections.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет подключений</h3>
              <p className="text-gray-500">Начните строить свою профессиональную сеть</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedConnections.map((connection) => {
                const otherUser = connection.requester_id === user?.id 
                  ? (connections.find(c => c.id === connection.id)?.receiver as Profile)
                  : (connections.find(c => c.id === connection.id)?.requester as Profile)
                
                if (!otherUser) return null
                
                return (
                  <Card key={connection.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.full_name || ''} />
                          <AvatarFallback>
                            {otherUser.full_name ? getInitials(otherUser.full_name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {otherUser.full_name || 'Без имени'}
                          </CardTitle>
                          {otherUser.position && (
                            <CardDescription className="truncate">
                              {otherUser.position}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {otherUser.company && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span className="truncate">{otherUser.company}</span>
                        </div>
                      )}
                      
                      {otherUser.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {otherUser.bio}
                        </p>
                      )}

                      {otherUser.linkedin_url && (
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <a href={otherUser.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
