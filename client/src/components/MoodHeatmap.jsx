import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subDays } from "date-fns";

export default function MoodHeatmap({ journals }) {

const moodValue=(mood)=>{
switch(mood){
case "happy": return 4
case "neutral": return 3
case "anxious": return 2
case "sad": return 1
default: return 0
}
}

const values=journals.map(j=>({
date:new Date(j.date || j.createdAt).toISOString().slice(0,10),
count:moodValue(j.mood)
}))

return(

<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">

<h3 className="font-semibold mb-4">
Mood Activity
</h3>

<CalendarHeatmap
startDate={subDays(new Date(),120)}
endDate={new Date()}
values={values}
/>

</div>

)

}