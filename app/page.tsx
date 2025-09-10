"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"

// Polyfill for crypto.randomUUID for browsers that don't support it
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Helper functions for local storage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
    return false
  }
}

const getFromLocalStorage = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  Paperclip,
  MessageCircle,
  Shield,
  Crown,
  Settings,
  Mic,
  Play,
  FileText,
  Users,
  Hash,
  MessageSquare,
  Menu,
  X,
} from "lucide-react"

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  authorUsername: string
  timestamp: Date
  category: string
  replies: ForumReply[]
  isPinned: boolean
  isLocked: boolean
}

interface ForumReply {
  id: string
  content: string
  author: string
  authorUsername: string
  timestamp: Date
  postId: string
}

interface Message {
  id: string
  text: string
  sender: string
  senderUsername: string
  timestamp: Date
  type: "text" | "file" | "voice"
  fileName?: string
  fileUrl?: string
  chatType: "main" | "dm" | "forum"
  dmRecipient?: string
  voiceUrl?: string
  voiceDuration?: number
}

interface AuthUser {
  id: string
  username: string
  displayName: string
  email: string
  bio: string
  avatar: string
  color: string
  isOnline: boolean
  lastSeen: string
  role: "user" | "vip" | "admin"
  prefix: string
  friends: string[]
  friendRequests: string[]
  joinedAt: string
  timeoutUntil?: string // Added timeout functionality
  timeoutReason?: string
}

interface AuthState {
  isAuthenticated: boolean
  currentUser: AuthUser | null
  isLoading: boolean
}

interface Theme {
  name: string
  primary: string
  secondary: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  sidebar: string
  sidebarForeground: string
}

const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
    return false
  }
}

const getFromLocalStorage = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}

export default function ChatApp() {
  // Initialize state
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    isLoading: true,
  })

  // Safe local storage interactions
  const safeGetItem = useCallback(<T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return defaultValue
    }
  }, [])

  const safeSetItem = useCallback((key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
      return false
    }
  }, [])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    bio: "",
  })

  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [users, setUsers] = useState<AuthUser[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>({
    name: "Orange",
    primary: "#ea580c",
    secondary: "#f97316",
    background: "#ffffff",
    foreground: "#4b5563",
    card: "#fffbeb",
    cardForeground: "#4b5563",
    sidebar: "#ffffff",
    sidebarForeground: "#4b5563",
  })
  const [tempTheme, setTempTheme] = useState<Theme>(currentTheme)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [chatType, setChatType] = useState<"main" | "dm" | "forum">("main")
  const [selectedDmUser, setSelectedDmUser] = useState<string | null>(null)
  const [dmConversations, setDmConversations] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showFriendRequests, setShowFriendRequests] = useState(false)

  const [showUserSearch, setShowUserSearch] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [showProfile, setShowProfile] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<AuthUser | null>(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState({
    displayName: "",
    bio: "",
    color: "#ea580c",
  })

  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [timeoutForm, setTimeoutForm] = useState({
    userId: "",
    duration: "1", // hours
    reason: "",
  })
  const [showPrefixModal, setShowPrefixModal] = useState(false)
  const [prefixForm, setPrefixForm] = useState({
    userId: "",
    prefix: "",
  })
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleForm, setRoleForm] = useState({
    userId: "",
    role: "user" as "user" | "vip" | "admin",
  })

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [createPostForm, setCreatePostForm] = useState({
    title: "",
    content: "",
    category: "general",
  })
  const [replyContent, setReplyContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const forumCategories = [
    { id: "general", name: "General Discussion", color: "#3b82f6" },
    { id: "announcements", name: "Announcements", color: "#ef4444" },
    { id: "help", name: "Help & Support", color: "#10b981" },
    { id: "feedback", name: "Feedback", color: "#f59e0b" },
    { id: "off-topic", name: "Off Topic", color: "#8b5cf6" },
  ]

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const register = async () => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const newUser: AuthUser = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4(),
        username: authForm.username,
        displayName: authForm.displayName || authForm.username,
        email: authForm.email,
        bio: authForm.bio || "New user",
        avatar: "",
        color: "#ea580c",
        isOnline: true,
        lastSeen: new Date().toISOString(),
        role: "user",
        prefix: "",
        friends: [],
        friendRequests: [],
        joinedAt: new Date().toISOString(),
      }

  // Save user to localStorage (in real app, this would be a database)

      // Check if username already exists
      if (existingUsers.find((u: AuthUser) => u.username === authForm.username)) {
        alert("Username already exists!")
        return
      }

      existingUsers.push(newUser)
      localStorage.setItem("users", JSON.stringify(existingUsers))
      localStorage.setItem("currentUser", JSON.stringify(newUser))

      setAuth({
        isAuthenticated: true,
        currentUser: newUser,
        isLoading: false,
      })
  setShowAuthModal(false)
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  const login = async () => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const user = existingUsers.find((u: AuthUser) => u.username === authForm.username)

      if (!user) {
        alert("User not found!")
        return
      }

      // Update user online status
      user.lastSeen = new Date().toISOString()

      const updatedUsers = existingUsers.map((u: AuthUser) => (u.id === user.id ? user : u))
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      localStorage.setItem("currentUser", JSON.stringify(user))

      setAuth({
        isAuthenticated: true,
        currentUser: user,
        isLoading: false,
      })
      setShowAuthModal(false)
      setConnectionStatus("connected")
    } catch (error) {
      console.error("Login failed:", error)
    }
  }
  const logout = () => {
    if (auth.currentUser) {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((u: AuthUser) =>
        u.id === auth.currentUser!.id ? { ...u, isOnline: false, lastSeen: new Date().toISOString() } : u,
      )
      localStorage.setItem("users", JSON.stringify(updatedUsers))
    }

    localStorage.removeItem("currentUser")
    setAuth({
      isAuthenticated: false,
      currentUser: null,
      isLoading: false,
    })
    setConnectionStatus("disconnected")
  }

  const sendFriendRequest = async (targetUserId: string) => {
    if (!auth.currentUser) return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === targetUserId && !user.friendRequests.includes(auth.currentUser!.id)) {
          return { ...user, friendRequests: [...user.friendRequests, auth.currentUser!.id] }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
      alert("Friend request sent!")
    } catch (error) {
      console.error("Failed to send friend request:", error)
    }
  }

  const acceptFriendRequest = async (requesterId: string) => {
    if (!auth.currentUser) return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === auth.currentUser!.id) {
          return {
            ...user,
            friends: [...user.friends, requesterId],
            friendRequests: user.friendRequests.filter((id) => id !== requesterId),
          }
        }
        if (user.id === requesterId) {
          return { ...user, friends: [...user.friends, auth.currentUser!.id] }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))

      // Update current user in auth state
      const updatedCurrentUser = updatedUsers.find((u: AuthUser) => u.id === auth.currentUser!.id)
      if (updatedCurrentUser) {
        setAuth((prev) => ({ ...prev, currentUser: updatedCurrentUser }))
        localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser))
      }

      setUsers(updatedUsers)
    } catch (error) {
      console.error("Failed to accept friend request:", error)
    }
  }

  const rejectFriendRequest = async (requesterId: string) => {
    if (!auth.currentUser) return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === auth.currentUser!.id) {
          return {
            ...user,
            friendRequests: user.friendRequests.filter((id) => id !== requesterId),
          }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))

      const updatedCurrentUser = updatedUsers.find((u: AuthUser) => u.id === auth.currentUser!.id)
      if (updatedCurrentUser) {
        setAuth((prev) => ({ ...prev, currentUser: updatedCurrentUser }))
        localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser))
      }

      setUsers(updatedUsers)
    } catch (error) {
      console.error("Failed to reject friend request:", error)
    }
  }

  const updateProfile = async () => {
    if (!auth.currentUser) return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === auth.currentUser!.id) {
          return {
            ...user,
            displayName: editProfileForm.displayName,
            bio: editProfileForm.bio,
            color: editProfileForm.color,
          }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))

      const updatedCurrentUser = updatedUsers.find((u: AuthUser) => u.id === auth.currentUser!.id)
      if (updatedCurrentUser) {
        setAuth((prev) => ({ ...prev, currentUser: updatedCurrentUser }))
        localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser))
      }

      setUsers(updatedUsers)
      setShowEditProfile(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  const openEditProfile = () => {
    if (auth.currentUser) {
      setEditProfileForm({
        displayName: auth.currentUser.displayName,
        bio: auth.currentUser.bio,
        color: auth.currentUser.color,
      })
      setShowEditProfile(true)
    }
  }

  const getFilteredUsers = () => {
    if (!userSearchQuery.trim()) return users
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearchQuery.toLowerCase()),
    )
  }

  const getFriendRequests = () => {
    if (!auth.currentUser) return []
    return users.filter((user) => auth.currentUser!.friendRequests.includes(user.id))
  }

  const getFriends = () => {
    if (!auth.currentUser) return []
    return users.filter((user) => auth.currentUser!.friends.includes(user.id))
  }

  const timeoutUser = async (userId: string, hours: number, reason: string) => {
    if (!auth.currentUser || auth.currentUser.role !== "admin") return

    try {
      const timeoutUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === userId) {
          return { ...user, timeoutUntil, timeoutReason: reason }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
      setShowTimeoutModal(false)
      alert(`User timed out for ${hours} hour(s)`)
    } catch (error) {
      console.error("Failed to timeout user:", error)
    }
  }

  const removeTimeout = async (userId: string) => {
    if (!auth.currentUser || auth.currentUser.role !== "admin") return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === userId) {
          const { timeoutUntil, timeoutReason, ...userWithoutTimeout } = user
          return userWithoutTimeout
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
      alert("Timeout removed")
    } catch (error) {
      console.error("Failed to remove timeout:", error)
    }
  }

  const updateUserRole = async (userId: string, newRole: "user" | "vip" | "admin") => {
    if (!auth.currentUser || auth.currentUser.role !== "admin") return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === userId) {
          return { ...user, role: newRole }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
      setShowRoleModal(false)
      alert(`User role updated to ${newRole}`)
    } catch (error) {
      console.error("Failed to update user role:", error)
    }
  }

  const updateUserPrefix = async (userId: string, prefix: string) => {
    if (!auth.currentUser || auth.currentUser.role !== "admin") return

    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = existingUsers.map((user: AuthUser) => {
        if (user.id === userId) {
          return { ...user, prefix: prefix.trim() }
        }
        return user
      })

      localStorage.setItem("users", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
      setShowPrefixModal(false)
      alert("User prefix updated")
    } catch (error) {
      console.error("Failed to update user prefix:", error)
    }
  }

  const isUserTimedOut = (user: AuthUser) => {
    if (!user.timeoutUntil) return false
    return new Date(user.timeoutUntil) > new Date()
  }

  const canUserSendMessages = (user: AuthUser) => {
    return !isUserTimedOut(user)
  }

  const createForumPost = async () => {
    if (!auth.currentUser || !createPostForm.title.trim() || !createPostForm.content.trim()) return

    if (!canUserSendMessages(auth.currentUser)) {
      alert("You are currently timed out and cannot create posts.")
      return
    }

    const newPost: ForumPost = {
      id: crypto.randomUUID(),
      title: createPostForm.title,
      content: createPostForm.content,
      author: auth.currentUser.displayName,
      authorUsername: auth.currentUser.username,
      timestamp: new Date(),
      category: createPostForm.category,
      replies: [],
      isPinned: false,
      isLocked: false,
    }

    try {
      const existingPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")
      const updatedPosts = [newPost, ...existingPosts]
      localStorage.setItem("forumPosts", JSON.stringify(updatedPosts))
      setForumPosts(updatedPosts)
      setShowCreatePost(false)
      setCreatePostForm({ title: "", content: "", category: "general" })
    } catch (error) {
      console.error("Failed to create forum post:", error)
    }
  }

  const addReply = async (postId: string) => {
    if (!auth.currentUser || !replyContent.trim()) return

    if (!canUserSendMessages(auth.currentUser)) {
      alert("You are currently timed out and cannot reply.")
      return
    }

    const newReply: ForumReply = {
      id: crypto.randomUUID(),
      content: replyContent,
      author: auth.currentUser.displayName,
      authorUsername: auth.currentUser.username,
      timestamp: new Date(),
      postId,
    }

    try {
      const existingPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")
      const updatedPosts = existingPosts.map((post: ForumPost) => {
        if (post.id === postId) {
          return { ...post, replies: [...post.replies, newReply] }
        }
        return post
      })

      localStorage.setItem("forumPosts", JSON.stringify(updatedPosts))
      setForumPosts(updatedPosts)

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, replies: [...selectedPost.replies, newReply] })
      }

      setReplyContent("")
    } catch (error) {
      console.error("Failed to add reply:", error)
    }
  }

  const togglePinPost = async (postId: string) => {
    if (!auth.currentUser || auth.currentUser.role !== "admin") return

    try {
      const existingPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")
      const updatedPosts = existingPosts.map((post: ForumPost) => {
        if (post.id === postId) {
          return { ...post, isPinned: !post.isPinned }
        }
        return post
      })

      localStorage.setItem("forumPosts", JSON.stringify(updatedPosts))
      setForumPosts(updatedPosts)
    } catch (error) {
      console.error("Failed to toggle pin:", error)
    }
  }

  const toggleLockPost = async (postId: string) => {
    if (!auth.currentUser || auth.currentUser.role !== "admin") return

    try {
      const existingPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")
      const updatedPosts = existingPosts.map((post: ForumPost) => {
        if (post.id === postId) {
          return { ...post, isLocked: !post.isLocked }
        }
        return post
      })

      localStorage.setItem("forumPosts", JSON.stringify(updatedPosts))
      setForumPosts(updatedPosts)

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, isLocked: !selectedPost.isLocked })
      }
    } catch (error) {
      console.error("Failed to toggle lock:", error)
    }
  }

  const getFilteredPosts = () => {
    let filtered = forumPosts
    if (selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory)
    }

    // Sort: pinned posts first, then by timestamp
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }

  const getCategoryInfo = (categoryId: string) => {
    return forumCategories.find((cat) => cat.id === categoryId) || forumCategories[0]
  }

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem("currentUser")
        if (savedUser) {
          const user = JSON.parse(savedUser)
          setAuth({
            isAuthenticated: true,
            currentUser: user,
            isLoading: false,
          })
          setConnectionStatus("connected")
        } else {
          setAuth({
            isAuthenticated: false,
            currentUser: null,
            isLoading: false,
          })
          setConnectionStatus("disconnected")
          setShowAuthModal(true)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setConnectionStatus("disconnected")
        setAuth({
          isAuthenticated: false,
          currentUser: null,
          isLoading: false,
        })
      }
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkAuth()
    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Load data from local storage
  const loadData = useCallback(() => {
    if (!auth.isAuthenticated) {
      setConnectionStatus("disconnected")
      return
    }

    try {
      const storedData = localStorage.getItem("chatData")
      if (storedData) {
        const data = JSON.parse(storedData)
        setMessages(data.messages || [])
        setUsers(data.users || [])
        setConnectionStatus(data.connectionStatus || "disconnected")
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }    try {
      setConnectionStatus("connecting");
      
      // Load users
      const savedUsers = localStorage.getItem("users");
      const users = savedUsers ? JSON.parse(savedUsers) : [];
      setUsers(users);
      
      // Load messages
      const savedMessages = localStorage.getItem("messages");
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      setMessages(messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
      
      // Load forum posts
      const savedPosts = localStorage.getItem("forumPosts");
      const posts = savedPosts ? JSON.parse(savedPosts) : [];
      setForumPosts(posts.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
        replies: p.replies.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }))
      })));
      
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Error loading data:", error);
      setConnectionStatus("disconnected");
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    loadLocalData();
    const interval = setInterval(loadLocalData, 3000); // Sync every 3 seconds
    return () => clearInterval(interval);
  }, [loadLocalData]);

        setUsers(allUsers)
        setMessages(
          allMessages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        )
        setForumPosts(
          allForumPosts.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
            replies: p.replies.map((r: any) => ({
              ...r,
              timestamp: new Date(r.timestamp),
            })),
          })),
        )
      }

      loadData()
      const interval = setInterval(loadData, 3000) // Sync every 3 seconds
      return () => clearInterval(interval)
    }
  }, [auth.isAuthenticated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        sendVoiceMessage(audioUrl, recordingTime)

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const sendVoiceMessage = async (voiceUrl: string, duration: number) => {
    if (!auth.currentUser) return

    if (!canUserSendMessages(auth.currentUser)) {
      alert("You are currently timed out and cannot send messages.")
      return
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      text: `Voice message (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")})`,
      sender: auth.currentUser.displayName,
      senderUsername: auth.currentUser.username,
      timestamp: new Date(),
      type: "voice",
      voiceUrl: voiceUrl,
      voiceDuration: duration,
      chatType: chatType,
  dmRecipient: chatType === "dm" && selectedDmUser ? selectedDmUser : undefined,
    }

    try {
      const existingMessages = JSON.parse(localStorage.getItem("messages") || "[]")
      const updatedMessages = [...existingMessages, newMessage]
      localStorage.setItem("messages", JSON.stringify(updatedMessages))

      setMessages((prev) => [...prev, newMessage])

      if (chatType === "dm" && selectedDmUser && !dmConversations.includes(selectedDmUser)) {
        setDmConversations((prev) => [...prev, selectedDmUser])
      }
    } catch (error) {
      console.error("Failed to send voice message:", error)
    }
  }

  const sendMessage = async () => {
    if (!auth.currentUser || (!currentMessage.trim() && !selectedFile)) return

    if (!canUserSendMessages(auth.currentUser)) {
      alert("You are currently timed out and cannot send messages.")
      return
    }

    try {
      let fileUrl
      if (selectedFile) {
        const reader = new FileReader()
        fileUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result)
          reader.readAsDataURL(selectedFile)
        })
      }

      const newMessage: Message = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4(),
        text: selectedFile ? `Shared file: ${selectedFile.name}` : currentMessage,
        sender: auth.currentUser.displayName,
        senderUsername: auth.currentUser.username,
        timestamp: new Date(),
        type: selectedFile ? "file" : "text",
        fileName: selectedFile?.name,
        fileUrl: fileUrl as string,
        chatType: chatType,
        dmRecipient: chatType === "dm" && selectedDmUser ? selectedDmUser : undefined,
        voiceUrl: undefined,
        voiceDuration: undefined,
      }    try {
      const existingMessages = JSON.parse(localStorage.getItem("messages") || "[]")
      const updatedMessages = [...existingMessages, newMessage]
      localStorage.setItem("messages", JSON.stringify(updatedMessages))

      setMessages((prev) => [...prev, newMessage])

      if (chatType === "dm" && selectedDmUser && !dmConversations.includes(selectedDmUser)) {
        setDmConversations((prev) => [...prev, selectedDmUser])
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }

    setCurrentMessage("")
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Convert file to local URL and store in localStorage
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: file.type,
          data: e.target?.result
        }
        // Store file metadata in localStorage
        const files = JSON.parse(localStorage.getItem("chatFiles") || "[]")
        files.push(fileData)
        localStorage.setItem("chatFiles", JSON.stringify(files))
        
        setSelectedFile(new File([file], file.name, { type: file.type }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatMessageTime = (date: Date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date"
      }
      return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      return "??"
    }
  }

  const getFilteredMessages = () => {
    if (chatType === "main") {
      return messages.filter((msg) => msg.chatType === "main" || !msg.chatType)
    } else if (chatType === "dm" && selectedDmUser) {
      return messages.filter(
        (msg) =>
          msg.chatType === "dm" &&
          ((msg.senderUsername === auth.currentUser?.username && msg.dmRecipient === selectedDmUser) ||
            (msg.senderUsername === selectedDmUser && msg.dmRecipient === auth.currentUser?.username)),
      )
    }
    return []
  }

  const getUserAvatarColor = (sender: string) => {
    const user = users.find((u) => u.displayName === sender)
    return user ? `bg-[${user.color}]` : "bg-gray-500"
  }

  const getUserPrefix = (senderUsername: string) => {
    const user = users.find((u) => u.username === senderUsername)
    return user?.prefix || ""
  }

  const getUserRoleColor = (senderUsername: string) => {
    const user = users.find((u) => u.username === senderUsername)
    if (user?.role === "admin") return "text-red-500"
    if (user?.role === "vip") return "text-yellow-500"
    return ""
  }

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Chat App</h1>
            <p className="text-muted-foreground">Join the conversation</p>
          </div>

          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                />
              </div>
              <Button onClick={login} className="w-full" disabled={!authForm.username}>
                Login
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div>
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={authForm.displayName}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={authForm.bio}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password"
                />
              </div>
              <Button onClick={register} className="w-full" disabled={!authForm.username || !authForm.email}>
                Register
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground,
      }}
    >
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>Share your thoughts with the community</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={createPostForm.title}
                onChange={(e) => setCreatePostForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title..."
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="post-category">Category</Label>
              <div className="flex gap-2 mt-2">
                {forumCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={createPostForm.category === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreatePostForm((prev) => ({ ...prev, category: category.id }))}
                    style={createPostForm.category === category.id ? { backgroundColor: category.color } : {}}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="post-content">Content</Label>
              <Textarea
                id="post-content"
                value={createPostForm.content}
                onChange={(e) => setCreatePostForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your post content..."
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">{createPostForm.content.length}/2000 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>
              Cancel
            </Button>
            <Button onClick={createForumPost} disabled={!createPostForm.title.trim() || !createPostForm.content.trim()}>
              Create Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        style={{ backgroundColor: getCategoryInfo(selectedPost.category).color }}
                        className="text-white"
                      >
                        {getCategoryInfo(selectedPost.category).name}
                      </Badge>
                      {selectedPost.isPinned && <Badge variant="secondary">📌 Pinned</Badge>}
                      {selectedPost.isLocked && <Badge variant="destructive">🔒 Locked</Badge>}
                    </div>
                    <DialogTitle className="text-xl">{selectedPost.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback
                          style={{
                            backgroundColor:
                              users.find((u) => u.username === selectedPost.authorUsername)?.color || "#ea580c",
                          }}
                        >
                          {selectedPost.author.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{selectedPost.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {selectedPost.timestamp.toLocaleDateString()} at {formatMessageTime(selectedPost.timestamp)}
                      </span>
                    </div>
                  </div>
                  {auth.currentUser?.role === "admin" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => togglePinPost(selectedPost.id)}>
                        {selectedPost.isPinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleLockPost(selectedPost.id)}>
                        {selectedPost.isLocked ? "Unlock" : "Lock"}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <Card className="p-4">
                  <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Replies ({selectedPost.replies.length})</h3>

                  <div className="space-y-4">
                    {selectedPost.replies.map((reply) => (
                      <Card key={reply.id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              style={{
                                backgroundColor:
                                  users.find((u) => u.username === reply.authorUsername)?.color || "#ea580c",
                              }}
                            >
                              {reply.author.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{reply.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {reply.timestamp.toLocaleDateString()} at {formatMessageTime(reply.timestamp)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
                      </Card>
                    ))}
                  </div>

                  {!selectedPost.isLocked && canUserSendMessages(auth.currentUser!) && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="reply-content">Add Reply</Label>
                      <Textarea
                        id="reply-content"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        maxLength={1000}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">{replyContent.length}/1000 characters</p>
                        <Button onClick={() => addReply(selectedPost.id)} disabled={!replyContent.trim()} size="sm">
                          Post Reply
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedPost.isLocked && (
                    <div className="mt-4 p-3 bg-muted rounded text-center text-sm text-muted-foreground">
                      This post is locked. No new replies can be added.
                    </div>
                  )}

                  {!canUserSendMessages(auth.currentUser!) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-center text-sm text-red-600">
                      You are currently timed out and cannot reply to posts.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(true)} className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {chatType === "main" ? "Main Chat" : chatType === "dm" ? "Direct Messages" : "Forum"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {chatType === "forum" && (
                <Button size="sm" onClick={() => setShowCreatePost(true)}>
                  New Post
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showMobileSidebar && (
            <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileSidebar(false)}>
              <div
                className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  {/* User Profile Section */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback style={{ backgroundColor: auth.currentUser?.color || "#ea580c" }}>
                        {auth.currentUser?.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{auth.currentUser?.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{auth.currentUser?.username}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={openEditProfile}>
                      Edit
                    </Button>
                  </div>

                  {/* Online Users */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Online Users ({users.filter((u) => u.isOnline).length})
                    </h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {users
                        .filter((u) => u.isOnline)
                        .slice(0, 10)
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              setSelectedProfile(user)
                              setShowProfile(true)
                              setShowMobileSidebar(false)
                            }}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback style={{ backgroundColor: user.color }}>
                                {user.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm flex-1 truncate">{user.displayName}</span>
                            {user.role === "admin" && <Shield className="h-3 w-3 text-red-500" />}
                            {user.role === "vip" && <Crown className="h-3 w-3 text-yellow-500" />}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Friend Requests */}
                  {auth.currentUser && getFriendRequests().length > 0 && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowFriendRequests(true)
                          setShowMobileSidebar(false)
                        }}
                        className="w-full justify-start"
                      >
                        Friend Requests ({getFriendRequests().length})
                      </Button>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowUserSearch(true)
                        setShowMobileSidebar(false)
                      }}
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Find Users
                    </Button>
                    {auth.currentUser?.role === "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAdminPanel(true)
                          setShowMobileSidebar(false)
                        }}
                        className="w-full justify-start"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logout}
                      className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Content */}
          <div className="flex-1 flex flex-col">
            {chatType === "main" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {getFilteredMessages().length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    getFilteredMessages().map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            style={{
                              backgroundColor:
                                users.find((u) => u.username === message.senderUsername)?.color || "#ea580c",
                            }}
                          >
                            {message.sender.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getUserPrefix(message.senderUsername) && (
                              <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                {getUserPrefix(message.senderUsername)}
                              </span>
                            )}
                            <span className={`text-sm font-medium ${getUserRoleColor(message.senderUsername)}`}>
                              {message.sender}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {message.chatType === "dm" && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">DM</span>
                            )}
                          </div>
                          {message.type === "voice" ? (
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 max-w-xs">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const audio = new Audio(message.voiceUrl)
                                  audio.play()
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <div className="flex-1">
                                <div className="text-sm text-muted-foreground">Voice message</div>
                                <div className="text-xs text-muted-foreground">
                                  {message.voiceDuration ? formatTime(message.voiceDuration) : "0:00"}
                                </div>
                              </div>
                            </div>
                          ) : message.type === "file" ? (
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 max-w-xs">
                              <FileText className="h-4 w-4" />
                              <a
                                href={message.fileUrl}
                                download={message.fileName}
                                className="text-sm text-blue-600 hover:underline truncate"
                              >
                                {message.fileName}
                              </a>
                            </div>
                          ) : (
                            <Card className="p-3 bg-card">
                              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                            </Card>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-background">
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={isRecording ? "bg-red-100 text-red-600" : ""}
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
                    </Button>
                    {isRecording && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        !canUserSendMessages(auth.currentUser!) ? "You are timed out" : "Type your message..."
                      }
                      className="flex-1"
                      disabled={!canUserSendMessages(auth.currentUser!) || isRecording}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || !canUserSendMessages(auth.currentUser!) || isRecording}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {chatType === "dm" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Direct Messages coming soon!</p>
              </div>
            )}

            {chatType === "forum" && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className="whitespace-nowrap"
                    >
                      All
                    </Button>
                    {forumCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        style={selectedCategory === category.id ? { backgroundColor: category.color } : {}}
                        className="whitespace-nowrap"
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {getFilteredPosts().length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No posts yet. Be the first to start a discussion!</p>
                    </div>
                  ) : (
                    getFilteredPosts().map((post) => (
                      <Card
                        key={post.id}
                        className="p-4 cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback
                              style={{
                                backgroundColor:
                                  users.find((u) => u.username === post.authorUsername)?.color || "#ea580c",
                              }}
                            >
                              {post.author.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                style={{ backgroundColor: getCategoryInfo(post.category).color }}
                                className="text-white text-xs"
                              >
                                {getCategoryInfo(post.category).name}
                              </Badge>
                              {post.isPinned && (
                                <Badge variant="secondary" className="text-xs">
                                  📌
                                </Badge>
                              )}
                              {post.isLocked && (
                                <Badge variant="destructive" className="text-xs">
                                  🔒
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-sm mb-1 line-clamp-2">{post.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>by {post.author}</span>
                              <div className="flex items-center gap-3">
                                <span>{post.replies.length} replies</span>
                                <span>{post.timestamp.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card">
            <div className="flex items-center justify-around p-2">
              <Button
                variant={chatType === "main" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChatType("main")}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              >
                <Hash className="h-5 w-5" />
                <span className="text-xs">Main Chat</span>
              </Button>
              <Button
                variant={chatType === "dm" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChatType("dm")}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">DMs</span>
              </Button>
              <Button
                variant={chatType === "forum" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChatType("forum")}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Forum</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout - Enhanced with sidebar
        <div className="flex h-screen">
          <div className="w-80 border-r border-border bg-card flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback style={{ backgroundColor: auth.currentUser?.color || "#ea580c" }}>
                    {auth.currentUser?.displayName
                      ? auth.currentUser.displayName.slice(0, 2).toUpperCase()
                      : "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{auth.currentUser?.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{auth.currentUser?.username}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={openEditProfile}>
                  Edit
                </Button>
              </div>

              {/* Chat Type Selector */}
              <div className="flex gap-1">
                <Button
                  variant={chatType === "main" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChatType("main")}
                  className="flex-1"
                >
                  <Hash className="h-4 w-4 mr-1" />
                  Main
                </Button>
                <Button
                  variant={chatType === "dm" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChatType("dm")}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  DMs
                </Button>
                <Button
                  variant={chatType === "forum" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChatType("forum")}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Forum
                </Button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
                <span className="capitalize">{connectionStatus}</span>
              </div>

              {/* Online Users */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Online Users ({users.filter((u) => u.isOnline).length})
                </h3>
                <div className="space-y-1">
                  {users
                    .filter((u) => u.isOnline)
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedProfile(user)
                          setShowProfile(true)
                        }}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback style={{ backgroundColor: user.color }}>
                            {user.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">{user.displayName}</span>
                        {user.role === "admin" && <Shield className="h-3 w-3 text-red-500" />}
                        {user.role === "vip" && <Crown className="h-3 w-3 text-yellow-500" />}
                      </div>
                    ))}
                </div>
              </div>

              {/* Friend Requests */}
              {auth.currentUser && getFriendRequests().length > 0 && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFriendRequests(true)}
                    className="w-full justify-start"
                  >
                    Friend Requests ({getFriendRequests().length})
                  </Button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserSearch(true)}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Users
                </Button>
                {auth.currentUser?.role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdminPanel(true)}
                    className="w-full justify-start"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">
                    {chatType === "main" ? "Main Chat" : chatType === "dm" ? "Direct Messages" : "Forum"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {chatType === "forum"
                      ? `${getFilteredPosts().length} posts`
                      : `${users.filter((u) => u.isOnline).length} users online`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {chatType === "forum" && <Button onClick={() => setShowCreatePost(true)}>New Post</Button>}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatType === "main" && (
                <>
                  {getFilteredMessages().length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    getFilteredMessages().map((message) => (
                      <div key={message.id} className="flex gap-3 p-3 hover:bg-muted/50">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getUserAvatarColor(message.sender)}`}
                        >
                          {message.sender.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getUserPrefix(message.senderUsername) && (
                              <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                {getUserPrefix(message.senderUsername)}
                              </span>
                            )}
                            <span className={`font-medium text-sm ${getUserRoleColor(message.senderUsername)}`}>
                              {message.sender}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {message.chatType === "dm" && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">DM</span>
                            )}
                          </div>
                          {message.type === "voice" ? (
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 max-w-xs">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const audio = new Audio(message.voiceUrl)
                                  audio.play()
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <div className="flex-1">
                                <div className="text-sm text-muted-foreground">Voice message</div>
                                <div className="text-xs text-muted-foreground">
                                  {message.voiceDuration ? formatTime(message.voiceDuration) : "0:00"}
                                </div>
                              </div>
                            </div>
                          ) : message.type === "file" ? (
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 max-w-xs">
                              <FileText className="h-4 w-4" />
                              <a
                                href={message.fileUrl}
                                download={message.fileName}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {message.fileName}
                              </a>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground break-words">{message.text}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}

              {chatType === "dm" && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Direct Messages coming soon!</p>
                </div>
              )}

              {chatType === "forum" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                    >
                      All Categories
                    </Button>
                    {forumCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        style={selectedCategory === category.id ? { backgroundColor: category.color } : {}}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  {getFilteredPosts().length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No posts yet. Be the first to start a discussion!</p>
                      <Button onClick={() => setShowCreatePost(true)}>Create First Post</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilteredPosts().map((post) => (
                        <Card
                          key={post.id}
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedPost(post)}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback
                                style={{
                                  backgroundColor:
                                    users.find((u) => u.username === post.authorUsername)?.color || "#ea580c",
                                }}
                              >
                                {post.author.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  style={{ backgroundColor: getCategoryInfo(post.category).color }}
                                  className="text-white"
                                >
                                  {getCategoryInfo(post.category).name}
                                </Badge>
                                {post.isPinned && (
                                  <Badge variant="secondary" className="text-xs">
                                    📌
                                  </Badge>
                                )}
                                {post.isLocked && (
                                  <Badge variant="destructive" className="text-xs">
                                    🔒
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg mb-2 line-clamp-1">{post.title}</h3>
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.content}</p>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span>by {post.author}</span>
                                  {users.find((u) => u.username === post.authorUsername)?.role === "admin" && (
                                    <Shield className="h-3 w-3 text-red-500" />
                                  )}
                                  {users.find((u) => u.username === post.authorUsername)?.role === "vip" && (
                                    <Crown className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span>{post.replies.length} replies</span>
                                  <span>
                                    {post.timestamp.toLocaleDateString()} at {formatMessageTime(post.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input */}
            {/* Updated message input to include voice recording button */}
            {chatType === "main" && (
              <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={isRecording ? "bg-red-100 text-red-600" : ""}
                  >
                    <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
                  </Button>
                  {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={!canUserSendMessages(auth.currentUser!) ? "You are timed out" : "Type your message..."}
                    className="flex-1"
                    disabled={!canUserSendMessages(auth.currentUser!) || isRecording}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || !canUserSendMessages(auth.currentUser!) || isRecording}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
