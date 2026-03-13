import { useState, useEffect, useRef } from "react";
import api from "../utils/api.js";
import { useTheme } from "../context/ThemeContext.jsx";

import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subDays } from "date-fns";

import SpeechRecognition, {
  useSpeechRecognition
} from "react-speech-recognition";

export default function Journal() {

const { theme } = useTheme()

const [text,setText]=useState("")
const [mood,setMood]=useState("")
const [journals,setJournals]=useState([])
const [loading,setLoading]=useState(false)

const [search,setSearch]=useState("")
const [filterMood,setFilterMood]=useState("")

const chartRef=useRef(null)
const chartInstanceRef=useRef(null)

const KEEP_MS=30*24*60*60*1000


/* ==============================
VOICE JOURNAL
============================== */

const { transcript,listening,resetTranscript } =
useSpeechRecognition()

useEffect(()=>{
if(transcript) setText(transcript)
},[transcript])


/* ==============================
AI MOOD DETECTION
============================== */

const detectEmotion=(text)=>{

const t=text.toLowerCase()

if(t.includes("happy")||t.includes("great")) return "happy"
if(t.includes("stress")||t.includes("worried")) return "anxious"
if(t.includes("sad")) return "sad"
if(t.includes("tired")) return "tired"

return "neutral"

}


/* ==============================
FETCH JOURNALS
============================== */

useEffect(()=>{

const fetchJournals=async()=>{

try{

const res=await api.get("/journal")
const list=res.data?.journals||res.data||[]

setJournals(list)

}catch{
console.log("offline")
}

}

fetchJournals()

},[])



/* ==============================
MOOD COLORS
============================== */

const moodColors={
happy:"#4ade80",
neutral:"#9CA3AF",
anxious:"#FB923C",
sad:"#60A5FA",
angry:"#EF4444",
tired:"#A78BFA"
}

const moodToValue=(m)=>
m==="happy"?4:
m==="neutral"?3:
m==="anxious"?2:
m==="sad"?1:0



/* ==============================
CHART DATA
============================== */

const chartData=journals
.slice()
.filter(e=>Date.now()-new Date(e.createdAt)<=KEEP_MS)
.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))
.map(entry=>({
date:new Date(entry.createdAt).toLocaleDateString(),
mood:entry.mood,
value:moodToValue(entry.mood)
}))



/* ==============================
CHART
============================== */

useEffect(()=>{

if(!chartRef.current) return

let chart

const createChart=async()=>{

const ChartModule=await import("chart.js/auto")
const Chart=ChartModule.default

const ctx=chartRef.current.getContext("2d")

if(chartInstanceRef.current)
chartInstanceRef.current.destroy()

chart=new Chart(ctx,{

type:"line",

data:{
labels:chartData.map(d=>d.date),
datasets:[{
data:chartData.map(d=>d.value),
borderColor:"#8b5cf6",
backgroundColor:"rgba(139,92,246,0.2)",
tension:0.4,
fill:true,
pointRadius:6,
pointBackgroundColor:chartData.map(d=>moodColors[d.mood])
}]
},

options:{
plugins:{legend:{display:false}},
scales:{
y:{
min:0,
max:4
}
}
}

})

chartInstanceRef.current=chart

}

createChart()

return()=>{
if(chartInstanceRef.current){
chartInstanceRef.current.destroy()
chartInstanceRef.current=null
}
}

},[chartData,theme])



/* ==============================
HEATMAP
============================== */

const heatmapData=journals.map(j=>({
date:new Date(j.createdAt).toISOString().slice(0,10),
count:moodToValue(j.mood)
}))



/* ==============================
STATS
============================== */

const moodStats=journals.reduce((acc,j)=>{
acc[j.mood]=(acc[j.mood]||0)+1
return acc
},{})

const wordCount=text.trim().split(/\s+/).filter(Boolean).length



/* ==============================
CREATE ENTRY
============================== */

const handleSubmit=async(e)=>{

e.preventDefault()

try{

setLoading(true)

const res=await api.post("/journal",{text,mood})

const newEntry=res.data?.journal||res.data

setJournals(prev=>[newEntry,...prev])

setText("")
setMood("")
resetTranscript()

}
finally{
setLoading(false)
}

}



/* ==============================
FILTER
============================== */

const filtered=journals.filter(e=>
(!filterMood||e.mood===filterMood)&&
e.text.toLowerCase().includes(search.toLowerCase())
)



/* ==============================
THEME
============================== */

const pageBg=theme==="dark"
?"bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white"
:"bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900"

const cardBg=theme==="dark"?"bg-gray-800":"bg-white"



/* ==============================
UI
============================== */

return(

<div className={`${pageBg} min-h-screen px-6 py-10`}>

{/* HEADER */}

<div className="max-w-6xl mx-auto mb-12 text-center">

<h1 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
My Journal
</h1>

<p className="text-gray-500 mt-3 text-lg">
Reflect on your thoughts and track your emotional journey
</p>

</div>



{/* ANALYTICS */}

<div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-12">

{Object.entries(moodStats).map(([m,count])=>(

<div
key={m}
className={`${cardBg} p-6 rounded-2xl shadow-lg hover:scale-[1.03] transition`}
>

<p className="text-sm text-gray-400 capitalize">
Mood
</p>

<h3 className="text-xl font-semibold capitalize">
{m}
</h3>

<p className="text-3xl font-bold text-purple-500 mt-2">
{count}
</p>

</div>

))}

</div>



{/* HEATMAP */}

<div className={`max-w-6xl mx-auto ${cardBg} p-8 rounded-3xl shadow-lg mb-12`}>

<h2 className="text-xl font-semibold mb-6">
🔥 Mood Activity
</h2>

<CalendarHeatmap
startDate={subDays(new Date(),120)}
endDate={new Date()}
values={heatmapData}
/>

</div>



{/* MOOD CHART */}

<div className={`max-w-6xl mx-auto ${cardBg} p-8 rounded-3xl shadow-lg mb-12`}>

<h2 className="text-xl font-semibold mb-6">
📈 Mood Trend
</h2>

{chartData.length>1
? <canvas ref={chartRef} className="h-60"></canvas>
: <p className="text-gray-400">Not enough data yet</p>
}

</div>



{/* JOURNAL FORM */}

<form
onSubmit={handleSubmit}
className={`${cardBg} max-w-3xl mx-auto p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-8`}
>


{/* TEXTAREA */}

<div>

<textarea
rows="6"
value={text}
onChange={(e)=>{
setText(e.target.value)
if(!mood) setMood(detectEmotion(e.target.value))
}}
placeholder="Write your thoughts and feelings..."
className="w-full p-6 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-lg bg-transparent"
/>


<div className="flex justify-between mt-3 text-sm text-gray-400">

<span>{wordCount} words</span>

<span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
AI mood: {detectEmotion(text)}
</span>

</div>

</div>



{/* VOICE CONTROLS */}

<div className="flex items-center gap-4">

<button
type="button"
onClick={()=>SpeechRecognition.startListening()}
className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow"
>
🎙 Start
</button>

<button
type="button"
onClick={()=>SpeechRecognition.stopListening()}
className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow"
>
Stop
</button>

<button
type="button"
onClick={resetTranscript}
className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl"
>
Clear
</button>

<span className="text-sm text-gray-400">
{listening ? "🎧 Listening..." : "Voice off"}
</span>

</div>



{/* MOOD SELECTOR */}

<div>

<p className="text-sm font-medium mb-3 text-gray-500">
How are you feeling?
</p>

<div className="grid grid-cols-3 gap-3">

{[
{emoji:"😊",value:"happy"},
{emoji:"😐",value:"neutral"},
{emoji:"😰",value:"anxious"},
{emoji:"😢",value:"sad"},
{emoji:"😴",value:"tired"},
{emoji:"😡",value:"angry"}
].map(m=>(

<button
key={m.value}
type="button"
onClick={()=>setMood(m.value)}
className={`flex flex-col items-center py-4 rounded-2xl border transition
${mood===m.value
?"bg-purple-600 text-white scale-105 shadow-lg"
:"bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"}
`}
>

<span className="text-2xl">{m.emoji}</span>
<span className="text-sm capitalize">{m.value}</span>

</button>

))}

</div>

</div>



{/* SAVE BUTTON */}

<div className="flex justify-end">

<button
disabled={loading}
className="px-8 py-3 rounded-xl text-white font-medium 
bg-gradient-to-r from-purple-500 to-purple-700
hover:scale-105 transition shadow-lg disabled:opacity-50"
>

{loading ? "Saving..." : "Save Entry"}

</button>

</div>

</form>



{/* ENTRIES */}

<div className="max-w-4xl mx-auto space-y-6 mt-12">

{filtered.map(entry=>(

<div
key={entry._id}
className={`${cardBg} p-6 rounded-2xl shadow-lg hover:shadow-xl transition`}
>

<p className="text-lg leading-relaxed">
{entry.text}
</p>

<div className="flex justify-between mt-4 text-sm text-gray-400">

<p>Mood: {entry.mood}</p>

<p>
{new Date(entry.createdAt).toLocaleDateString()}
</p>

</div>

</div>

))}

</div>

</div>

)

}