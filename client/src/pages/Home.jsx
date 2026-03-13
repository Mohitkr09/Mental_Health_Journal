// src/pages/Home.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subDays } from "date-fns";

import DailyMoodPopup from "../components/DailyMoodPopup.jsx";
import api from "../utils/api.js";

import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

import qrcode from "../assets/qrcode.png";

export default function Home() {

const navigate = useNavigate()

const { journals, addEntry } = useJournal()
const { user } = useAuth()
const { theme } = useTheme()

const [schedule,setSchedule] = useState(null)
const [recommendations,setRecommendations] = useState([])
const [loadingSchedule,setLoadingSchedule] = useState(false)
const [completedMap,setCompletedMap] = useState({})

/* =========================
MENTAL SCORE
========================= */

const mentalScore = useMemo(()=>{

let score = 50

journals?.forEach(j=>{

switch(j.mood){
case "happy": score+=2; break
case "neutral": score+=1; break
case "anxious": score-=1; break
case "sad": score-=2; break
default: break
}

})

return Math.max(0,Math.min(100,score))

},[journals])


/* =========================
HEATMAP DATA
========================= */

const heatmapData = journals?.map(j=>({
date:new Date(j.createdAt||j.date).toISOString().slice(0,10),
count:1
}))||[]

/* =========================
WEEKLY REPORT
========================= */

const weeklyReport = useMemo(()=>{

const moods={}
journals?.slice(0,7).forEach(j=>{
moods[j.mood]=(moods[j.mood]||0)+1
})

return moods

},[journals])


/* =========================
AFFIRMATION
========================= */

const affirmations=[
"You are stronger than your thoughts.",
"Progress is progress, no matter how small.",
"You deserve peace and happiness.",
"Your feelings are valid.",
"Every day is a new beginning."
]

const affirmation=useMemo(
()=>affirmations[Math.floor(Math.random()*affirmations.length)],
[]
)


/* =========================
GREETING
========================= */

const greeting=()=>{

const hour=new Date().getHours()

if(hour<12) return "Good Morning ☀️"
if(hour<18) return "Good Afternoon 🌤"
return "Good Evening 🌙"

}


/* =========================
FETCH SCHEDULE
========================= */

useEffect(()=>{

const fetchSchedule=async()=>{

if(!user) return

try{

setLoadingSchedule(true)

const res=await api.get("/schedule")

setSchedule(res.data)

}catch(err){
console.log("No schedule yet")
}
finally{
setLoadingSchedule(false)
}

}

fetchSchedule()

},[user])


/* =========================
TIMELINE
========================= */

const timelineItems=useMemo(()=>{

const items=schedule?.items||[]

return items.sort((a,b)=>a.time.localeCompare(b.time))

},[schedule])


const toggleComplete=(task)=>{

const key=`${task.time}_${task.title}`

setCompletedMap(prev=>({
...prev,
[key]:true
}))

}


/* =========================
UI
========================= */

return(

<div className={`min-h-screen ${theme==="dark"
? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white"
: "bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900"}`}>

{user && <DailyMoodPopup onMoodSelect={()=>{}}/>}

{/* HERO */}

<section className="max-w-7xl mx-auto px-6 pt-12 text-center">

<h1 className="text-4xl md:text-5xl font-bold">

{greeting()}, {user?.name || "Friend"}

</h1>

<p className="mt-3 text-gray-500 text-lg">
Your mental wellness dashboard
</p>

</section>


{/* DASHBOARD */}

<section className="max-w-7xl mx-auto px-6 mt-12 grid md:grid-cols-4 gap-6">

{/* SCORE */}

<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 rounded-2xl shadow">

<p className="text-sm text-gray-500">
Mental Health Score
</p>

<p className="text-3xl font-bold mt-2">
{mentalScore}/100
</p>

<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">

<div
className="bg-purple-600 h-2 rounded-full transition-all"
style={{width:`${mentalScore}%`}}
/>

</div>

</div>


{/* MOOD */}

<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 rounded-2xl shadow">

<p className="text-sm text-gray-500">
Today's Mood
</p>

<p className="text-2xl font-semibold mt-2">
{schedule?.mood || "Not set"}
</p>

</div>


{/* STRESS */}

<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 rounded-2xl shadow">

<p className="text-sm text-gray-500">
Stress Score
</p>

<p className="text-2xl font-semibold mt-2">
{schedule?.stressScore || "--"}
</p>

</div>


{/* SLEEP */}

<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 rounded-2xl shadow">

<p className="text-sm text-gray-500">
Sleep Tip
</p>

<p className="text-sm mt-2">
{schedule?.sleepTip || "Aim for 7-9 hours"}
</p>

</div>

</section>


{/* AFFIRMATION */}

<section className="max-w-4xl mx-auto mt-12 px-6">

<div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg text-center">

<h3 className="text-xl font-semibold">
Daily Affirmation
</h3>

<p className="mt-4 text-lg italic">
"{affirmation}"
</p>

</div>

</section>


{/* MOOD HEATMAP */}

<section className="max-w-6xl mx-auto mt-14 px-6">

<h2 className="text-xl font-semibold mb-4">
Mood Activity
</h2>

<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">

<CalendarHeatmap
startDate={subDays(new Date(),120)}
endDate={new Date()}
values={heatmapData}
/>

</div>

</section>


{/* WEEKLY REPORT */}

<section className="max-w-6xl mx-auto mt-14 px-6">

<h2 className="text-xl font-semibold mb-4">
Weekly Mood Report
</h2>

<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">

{Object.entries(weeklyReport).map(([mood,count])=>(
<div key={mood} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">

<span className="capitalize">{mood}</span>
<span>{count}</span>

</div>
))}

</div>

</section>


{/* QUICK ACTIONS */}

<section className="max-w-4xl mx-auto mt-14 px-6 grid sm:grid-cols-2 gap-6">

<button
onClick={()=>navigate("/journal")}
className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:scale-105 transition text-lg"
>
✍️ Write Journal
</button>

<button
onClick={()=>navigate("/chat")}
className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:scale-105 transition text-lg"
>
🤖 Talk with AI
</button>

</section>


{/* TIMELINE */}

<section className="max-w-5xl mx-auto mt-16 px-6">

<h2 className="text-2xl font-bold mb-6">
Today's Wellness Timeline
</h2>

{loadingSchedule && <p>Loading schedule...</p>}

<div className="space-y-6 border-l-2 border-purple-500 pl-6">

{timelineItems.map((item)=>{

const key=`${item.time}_${item.title}`
const completed=completedMap[key]

return(

<div key={key} className="relative">

<div className="absolute -left-[10px] w-4 h-4 bg-purple-600 rounded-full"></div>

<div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow">

<p className="font-semibold">{item.title}</p>

<p className="text-sm text-gray-500">
{item.time}
</p>

<button
onClick={()=>toggleComplete(item)}
className="mt-3 text-xs px-3 py-1 bg-purple-600 text-white rounded"
>
{completed?"Completed":"Mark Done"}
</button>

</div>

</div>

)

})}

</div>

</section>


{/* DOWNLOAD */}

<section className="mt-20 bg-white dark:bg-gray-800 p-10 rounded-3xl max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 shadow">

<div>

<h3 className="text-3xl font-bold">
Download MindCare
</h3>

<p className="text-gray-500 mt-3">
Access your journal anytime anywhere.
</p>

</div>

<img src={qrcode} className="w-32"/>

</section>


<footer className="mt-20 text-center text-gray-500 pb-6">

© {new Date().getFullYear()} MindCare

</footer>

</div>

)

}