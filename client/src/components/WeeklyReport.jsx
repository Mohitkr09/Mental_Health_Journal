import { useMemo } from "react";

export default function WeeklyReport({ journals }){

const report = useMemo(()=>{

const last7=journals.slice(0,7)

const moods={}

last7.forEach(j=>{
moods[j.mood]=(moods[j.mood]||0)+1
})

return{
total:last7.length,
moods
}

},[journals])

return(

<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">

<h3 className="font-semibold mb-4">
Weekly Mental Health Report
</h3>

<p className="text-sm text-gray-500">
Entries this week: {report.total}
</p>

<div className="mt-4 space-y-2">

{Object.entries(report.moods).map(([mood,count])=>(
<div key={mood} className="flex justify-between">

<span className="capitalize">
{mood}
</span>

<span>
{count}
</span>

</div>
))}

</div>

</div>

)

}