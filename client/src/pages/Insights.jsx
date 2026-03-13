import { useState, useEffect, useRef } from "react";
import { useJournal } from "../context/JournalContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import axios from "axios";

import {
Loader2,
Heart,
HandHelping,
Send,
Mic,
Play,
StopCircle,
Edit3,
Trash2
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

export default function Insights() {

const { theme } = useTheme()

const [communityPosts,setCommunityPosts]=useState([])
const [newPost,setNewPost]=useState("")
const [loadingPosts,setLoadingPosts]=useState(false)
const [posting,setPosting]=useState(false)

const [editingPostId,setEditingPostId]=useState(null)
const [editingText,setEditingText]=useState("")

const [recording,setRecording]=useState(false)
const [audioBlob,setAudioBlob]=useState(null)
const [transcribing,setTranscribing]=useState(false)
const [playing,setPlaying]=useState(false)

const mediaRecorderRef=useRef(null)
const audioChunksRef=useRef([])
const audioRef=useRef(null)

const API_BASE_URL =
import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

const token = localStorage.getItem("token")

/* ======================
FETCH POSTS
====================== */

const fetchPosts=async()=>{

setLoadingPosts(true)

try{

const res=await axios.get(
`${API_BASE_URL}/auth/community/posts`,
{
headers:{Authorization:`Bearer ${token}`}
}
)

if(Array.isArray(res.data)){

setCommunityPosts(
res.data.sort(
(a,b)=>
new Date(b.date||b.createdAt)-
new Date(a.date||a.createdAt)
)
)

}

}catch(err){

console.error(err)

}
finally{
setLoadingPosts(false)
}

}

useEffect(()=>{

fetchPosts()

const interval=setInterval(fetchPosts,30000)

return()=>clearInterval(interval)

},[])


/* ======================
POST MESSAGE
====================== */

const handlePost=async(textOverride=null)=>{

const content=textOverride||newPost.trim()

if(!content) return

setPosting(true)

try{

const res=await axios.post(
`${API_BASE_URL}/auth/community/share`,
{ text:content , mood:"neutral" },
{
headers:{Authorization:`Bearer ${token}`}
}
)

if(res.data){

setCommunityPosts(prev=>[res.data,...prev])
setNewPost("")

}

}catch(err){

console.error(err)

}
finally{

setPosting(false)

}

}

/* ======================
REACT
====================== */

const handleReact=async(postId,type)=>{

try{

setCommunityPosts(prev=>
prev.map(post=>
post._id===postId
?{
...post,
likes:{
...post.likes,
[type]:(post.likes?.[type]||0)+1
}
}
:post
)
)

await axios.post(
`${API_BASE_URL}/auth/community/react`,
{postId,type},
{
headers:{Authorization:`Bearer ${token}`}
}
)

}catch(err){

console.error(err)

}

}

/* ======================
VOICE RECORD
====================== */

const startRecording=async()=>{

try{

const stream=await navigator.mediaDevices.getUserMedia({audio:true})

const recorder=new MediaRecorder(stream)

mediaRecorderRef.current=recorder

audioChunksRef.current=[]

recorder.ondataavailable=e=>{
audioChunksRef.current.push(e.data)
}

recorder.onstop=async()=>{

const blob=new Blob(audioChunksRef.current,{type:"audio/webm"})

setAudioBlob(blob)

await transcribeAndPost(blob)

}

recorder.start()

setRecording(true)

}catch(err){

alert("Microphone access denied")

}

}

const stopRecording=()=>{

if(mediaRecorderRef.current){

mediaRecorderRef.current.stop()

setRecording(false)

}

}

/* ======================
TRANSCRIBE
====================== */

const transcribeAndPost=async(blob)=>{

setTranscribing(true)

try{

const formData=new FormData()

formData.append("audio",blob,"recording.webm")

const res=await axios.post(
`${API_BASE_URL}/auth/voice-transcribe`,
formData,
{
headers:{
Authorization:`Bearer ${token}`
}
}
)

if(res.data?.text){

await handlePost(res.data.text)

}

}catch(err){

console.error(err)

}
finally{

setTranscribing(false)

}

}

/* ======================
PLAY AUDIO
====================== */

const playAudio=()=>{

if(!audioBlob) return

const url=URL.createObjectURL(audioBlob)

const audio=new Audio(url)

audioRef.current=audio

audio.play()

setPlaying(true)

audio.onended=()=>setPlaying(false)

}

/* ======================
UI
====================== */

return(

<div className={`min-h-screen py-10 px-4 transition-colors duration-500
${theme==="dark"
?"bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100"
:"bg-gradient-to-b from-purple-50 to-white text-gray-900"
}`}>

<div className="max-w-3xl mx-auto">

{/* HEADER */}

<div className="mb-6 text-center">

<h2 className="text-3xl font-bold">
Community Wall
</h2>

<p className="text-gray-500 text-sm mt-1">
Share thoughts anonymously with the community
</p>

</div>


{/* COMPOSER */}

<div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow mb-6">

<textarea
rows={2}
placeholder="Share something with the community..."
value={newPost}
onChange={(e)=>setNewPost(e.target.value)}
className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-400 resize-none"
/>

<div className="flex justify-between items-center mt-3">

<div className="flex gap-3">

<button
onClick={recording?stopRecording:startRecording}
className={`p-3 rounded-full text-white
${recording?"bg-red-500 animate-pulse":"bg-green-500"}
`}
>
{recording?<StopCircle/>:<Mic/>}
</button>

{audioBlob && (

<button
onClick={playAudio}
className="p-3 bg-blue-500 text-white rounded-full"
>
{playing?<Loader2 className="animate-spin"/>:<Play/>}
</button>

)}

</div>

<button
onClick={()=>handlePost()}
disabled={posting||!newPost.trim()}
className="px-4 py-2 rounded-lg bg-purple-600 text-white flex items-center gap-2"
>
{posting?<Loader2 className="animate-spin"/>:<Send size={16}/>}
Post
</button>

</div>

</div>


{/* POSTS */}

{loadingPosts?(
<p className="text-center animate-pulse">
Loading community posts...
</p>
):(

<div className="space-y-5">

<AnimatePresence>

{communityPosts.map(post=>(

<motion.div
key={post._id}
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
exit={{opacity:0}}
className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
>

{/* USER */}

<div className="flex items-center gap-3 mb-3">

<img
src={
post.user?.avatar?.startsWith("http")
?post.user.avatar
:`https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name||"User")}&background=6D28D9&color=fff`
}
className="w-10 h-10 rounded-full"
/>

<div>

<p className="text-sm font-semibold">
{post.user?.name || "Anonymous"}
</p>

<p className="text-xs text-gray-400">
{new Date(post.date||post.createdAt).toLocaleString()}
</p>

</div>

</div>


{/* TEXT */}

<p className="text-base mb-4">
{post.text}
</p>


{/* ACTIONS */}

<div className="flex gap-3 flex-wrap">

<button
onClick={()=>handleReact(post._id,"support")}
className="flex items-center gap-1 px-3 py-1 bg-pink-500 text-white rounded-full text-sm"
>
<Heart size={14}/>
{post.likes?.support||0}
</button>

<button
onClick={()=>handleReact(post._id,"relate")}
className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
>
<HandHelping size={14}/>
{post.likes?.relate||0}
</button>

<button
onClick={()=>{
setEditingPostId(post._id)
setEditingText(post.text)
}}
className="flex items-center gap-1 px-3 py-1 bg-indigo-500 text-white rounded-full text-sm"
>
<Edit3 size={14}/>
Edit
</button>

<button
onClick={()=>deletePost(post._id)}
className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full text-sm"
>
<Trash2 size={14}/>
Delete
</button>

</div>

</motion.div>

))}

</AnimatePresence>

</div>

)}

</div>

</div>

)

}