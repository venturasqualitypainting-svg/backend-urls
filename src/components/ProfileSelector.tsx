import { useState } from 'react'
import { UserPlus, X, Lock } from 'lucide-react'
import { useProfile, Profile, AVATARS } from '../context/ProfileContext'

interface ProfileSelectorProps {
  onProfileSelect: (profile: Profile) => void
}

export default function ProfileSelector({ onProfileSelect }: ProfileSelectorProps) {
  const { profiles, addProfile, removeProfile, parentalPin } = useProfile()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [isKids, setIsKids] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return
    addProfile(newProfileName.trim(), isKids, selectedAvatar)
    setNewProfileName('')
    setIsKids(false)
    setSelectedAvatar(AVATARS[0])
    setShowAddModal(false)
  }

  const handleProfileClick = (profile: Profile) => {
    if (profile.isKids) {
      onProfileSelect(profile)
    } else if (parentalPin) {
      setTargetProfile(profile)
      setPinInput('')
      setPinError('')
    } else {
      onProfileSelect(profile)
    }
  }

  const verifyPin = () => {
    if (pinInput === parentalPin && targetProfile) {
      onProfileSelect(targetProfile)
      setTargetProfile(null)
    } else {
      setPinError('PIN incorrecto')
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">¿Quién está viendo?</h1>
      
      <div className="flex flex-wrap justify-center gap-8 mb-12">
        {profiles.map((profile) => (
          <div key={profile.id} className="flex flex-col items-center group">
            <button
              onClick={() => handleProfileClick(profile)}
              className="relative w-24 h-24 md:w-32 md:h-32 rounded-md overflow-hidden border-2 border-transparent hover:border-white transition-all"
            >
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              {profile.isKids && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#00D4FF] text-black text-[10px] font-bold py-0.5 text-center">
                  KIDS
                </div>
              )}
            </button>
            <span className="text-[#808080] group-hover:text-white mt-3 text-lg transition-colors">{profile.name}</span>
            {profiles.length > 1 && (
              <button 
                onClick={() => removeProfile(profile.id)}
                className="opacity-0 group-hover:opacity-100 text-[#E50914] text-xs mt-2 hover:underline"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}

        {profiles.length < 4 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center group"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-md bg-[#2F2F2F] flex items-center justify-center border-2 border-transparent group-hover:border-white group-hover:bg-[#3F3F3F] transition-all">
              <UserPlus className="w-10 h-10 text-[#808080] group-hover:text-white" />
            </div>
            <span className="text-[#808080] group-hover:text-white mt-3 text-lg transition-colors">Agregar Perfil</span>
          </button>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Agregar Perfil</h2>
              <button onClick={() => setShowAddModal(false)}><X className="text-white" /></button>
            </div>
            
            <p className="text-[#808080] text-sm mb-2">Elige un avatar:</p>
            <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
              {AVATARS.map((avatar) => (
                <img
                  key={avatar}
                  src={avatar}
                  alt="Avatar"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-14 h-14 rounded-md cursor-pointer border-2 transition-all ${
                    selectedAvatar === avatar ? 'border-[#E50914] scale-110' : 'border-transparent hover:border-white'
                  }`}
                />
              ))}
            </div>

            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Nombre del perfil"
              className="w-full bg-[#333] border border-[#444] rounded p-3 text-white mb-4 focus:border-[#E50914] outline-none"
              maxLength={15}
            />
            <label className="flex items-center gap-3 text-white mb-6 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isKids} 
                onChange={(e) => setIsKids(e.target.checked)}
                className="w-5 h-5 accent-[#00D4FF]" 
              />
              <span>¿Es un perfil para niños?</span>
            </label>
            <button 
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
              className="w-full bg-[#E50914] hover:bg-[#F40612] text-white font-bold py-3 rounded disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {targetProfile && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg p-6 w-full max-w-sm text-center">
            <Lock className="w-12 h-12 text-[#E50914] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Ingrese el PIN Parental</h2>
            <p className="text-[#808080] text-sm mb-6">Este perfil requiere verificación.</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#333] border border-[#444] rounded p-3 text-white text-center text-2xl tracking-widest mb-4 focus:border-[#E50914] outline-none"
              placeholder="••••"
              autoFocus
            />
            {pinError && <p className="text-[#E50914] text-sm mb-4">{pinError}</p>}
            <div className="flex gap-3">
              <button 
                onClick={() => setTargetProfile(null)}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={verifyPin}
                className="flex-1 bg-[#E50914] hover:bg-[#F40612] text-white font-bold py-3 rounded"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
