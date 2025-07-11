import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { Camera, Save, User, Building, Globe, Linkedin } from 'lucide-react'

export function Profile() {
  const { profile, updateProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    
    const formData = new FormData(e.currentTarget)
    
    const updates = {
      full_name: formData.get('full_name') as string,
      bio: formData.get('bio') as string,
      company: formData.get('company') as string,
      position: formData.get('position') as string,
      linkedin_url: formData.get('linkedin_url') as string,
      avatar_url: formData.get('avatar_url') as string,
    }

    try {
      await updateProfile(updates)
      
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      })
      
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Мой профиль</h2>
        <p className="text-gray-600">Управляйте информацией о себе</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>
                Эта информация будет видна другим участникам
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name ? getInitials(profile.full_name) : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar_url">URL аватара</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    defaultValue={profile?.avatar_url || ''}
                    placeholder="https://example.com/avatar.jpg"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Введите ссылку на изображение
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Полное имя *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profile?.full_name || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Должность</Label>
                  <Input
                    id="position"
                    name="position"
                    defaultValue={profile?.position || ''}
                    placeholder="Senior Developer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Компания</Label>
                <Input
                  id="company"
                  name="company"
                  defaultValue={profile?.company || ''}
                  placeholder="Название компании"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile?.bio || ''}
                  placeholder="Расскажите о себе, своих интересах и профессиональных целях..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn профиль</Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  defaultValue={profile?.linkedin_url || ''}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Save className="w-4 h-4 mr-2" />}
                  Сохранить
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name ? getInitials(profile.full_name) : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {profile?.full_name || 'Имя не указано'}
                  </h3>
                  {profile?.position && profile?.company && (
                    <p className="text-lg text-gray-600 mt-1">
                      {profile.position} в {profile.company}
                    </p>
                  )}
                  {profile?.email && (
                    <p className="text-gray-500 mt-1">{profile.email}</p>
                  )}
                </div>
              </div>

              {profile?.bio && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">О себе</h4>
                  <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile?.company && (
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Компания</p>
                      <p className="text-gray-600">{profile.company}</p>
                    </div>
                  </div>
                )}

                {profile?.position && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Должность</p>
                      <p className="text-gray-600">{profile.position}</p>
                    </div>
                  </div>
                )}

                {profile?.linkedin_url && (
                  <div className="flex items-center space-x-3">
                    <Linkedin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">LinkedIn</p>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Перейти к профилю
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {(!profile?.full_name || !profile?.bio || !profile?.company) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Заполните профиль</h4>
                  <p className="text-blue-700 text-sm">
                    Полная информация о профиле поможет другим участникам лучше узнать вас и установить полезные связи.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {profile?.created_at ? 
                Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0
              }
            </div>
            <div className="text-sm text-gray-600">дней на платформе</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">мероприятий посещено</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">контактов в сети</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
