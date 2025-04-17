import { DashboardHeader } from "@/components/dashboard-header"
import { SongsList } from "@/components/songs-list"
import { UploadSongForm } from "@/components/forms/upload-song-form"

export default function DashboardPage() {
  return (
    <div>
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <UploadSongForm />
        <SongsList />
      </div>
    </div>
  )
}