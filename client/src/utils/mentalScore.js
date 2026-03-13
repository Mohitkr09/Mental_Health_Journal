export function calculateMentalScore(entries){

if(!entries.length) return 50

let score=50

entries.forEach(e=>{

switch(e.mood){

case "happy":
score+=2
break

case "neutral":
score+=1
break

case "anxious":
score-=1
break

case "sad":
score-=2
break

default:
break

}

})

if(score>100) score=100
if(score<0) score=0

return score

}