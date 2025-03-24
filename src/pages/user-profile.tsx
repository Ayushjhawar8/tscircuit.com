import React, { useState } from "react"
import { useParams } from "wouter"
import { useQuery } from "react-query"
import { useAxios } from "@/hooks/use-axios"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Snippet } from "fake-snippets-api/lib/db/schema"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { GitHubLogoIcon, StarIcon, LockClosedIcon } from "@radix-ui/react-icons"
import { Input } from "@/components/ui/input"
import { useGlobalStore } from "@/hooks/use-global-store"
import { MoreVertical, Trash2, Globe } from "lucide-react"
import { useConfirmDeleteSnippetDialog } from "@/components/dialogs/confirm-delete-snippet-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OptimizedImage } from "@/components/OptimizedImage"
import { useSnippetsBaseApiUrl } from "@/hooks/use-snippets-base-api-url"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TypeBadge } from "@/components/TypeBadge"

export const UserProfilePage = () => {
  const { username } = useParams()
  const axios = useAxios()
  const apiBaseUrl = useSnippetsBaseApiUrl()

  const getRelativeTimeString = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffInMonths =
      (now.getFullYear() - past.getFullYear()) * 12 +
      now.getMonth() -
      past.getMonth()
    const diffInDays = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffInDays < 1) return "today"
    if (diffInDays === 1) return "yesterday"
    if (diffInDays < 30) return `${diffInDays} days ago`
    if (diffInMonths < 12)
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`
    const years = Math.floor(diffInMonths / 12)
    return `${years} year${years > 1 ? "s" : ""} ago`
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const session = useGlobalStore((s) => s.session)
  const isCurrentUserProfile = username === session?.github_username
  const { Dialog: DeleteDialog, openDialog: openDeleteDialog } =
    useConfirmDeleteSnippetDialog()
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null)

  const { data: userSnippets, isLoading } = useQuery<Snippet[]>(
    ["userSnippets", username],
    async () => {
      const response = await axios.get(`/snippets/list?owner_name=${username}`)
      return response.data.snippets
    },
  )

  const filteredSnippets = userSnippets?.filter((snippet) => {
    const isMatchingSearchQuery =
      !searchQuery ||
      snippet.unscoped_name.toLowerCase().includes(searchQuery.toLowerCase())
    const isMatchingActiveTab =
      activeTab === "all" ||
      (activeTab === "starred" && (snippet?.is_starred || false))
    return isMatchingSearchQuery && isMatchingActiveTab
  })

  const handleDeleteClick = (e: React.MouseEvent, snippet: Snippet) => {
    e.preventDefault() // Prevent navigation
    setSnippetToDelete(snippet)
    openDeleteDialog()
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://github.com/${username}.png`} />
            <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {isCurrentUserProfile ? "My Profile" : `${username}'s Profile`}
            </h1>
            <p className="text-gray-600">
              Snippets: {userSnippets?.length || 0}
            </p>
          </div>
        </div>
        <div className="mb-6">
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center"
          >
            <Button variant="outline">
              <GitHubLogoIcon className="mr-2" />
              View GitHub Profile
            </Button>
          </a>
        </div>
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">Snippets</TabsTrigger>
            <TabsTrigger value="starred">Starred Snippets</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          type="text"
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
        {isLoading ? (
          <div>Loading snippets...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSnippets
              ?.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
              ?.map((snippet) => (
                <Link
                  key={snippet.snippet_id}
                  href={`/${snippet.owner_name}/${snippet.unscoped_name}`}
                >
                  <div className="border p-4 rounded-md hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-md font-semibold truncate flex items-center gap-2">
                          {snippet.unscoped_name}
                          <TypeBadge type={snippet.snippet_type} />
                          <span className="text-xs text-gray-500 font-normal">
                            {getRelativeTimeString(snippet.updated_at)}
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center text-gray-600">
                          <StarIcon className="w-4 h-4 mr-1" />
                          <span className="min-w-[1rem] text-sm">
                            {snippet.star_count || 0}
                          </span>
                        </div>
                        {snippet.is_private ? (
                          <div className="flex items-center text-gray-600">
                            <LockClosedIcon className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-600">
                            <Globe className="w-4 h-4" />
                          </div>
                        )}
                        {isCurrentUserProfile && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-xs text-red-600"
                                onClick={(e) => handleDeleteClick(e, snippet)}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete Snippet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-48 w-full bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      <OptimizedImage
                        src={`${apiBaseUrl}/snippets/images/${snippet.owner_name}/${snippet.unscoped_name}/pcb.svg`}
                        alt={`PCB preview for ${snippet.unscoped_name}`}
                        className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
      {snippetToDelete && (
        <DeleteDialog
          snippetId={snippetToDelete.snippet_id}
          snippetName={snippetToDelete.unscoped_name}
        />
      )}
      <Footer />
    </div>
  )
}
