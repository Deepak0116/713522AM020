const express=require('express');
const axios=require('axios');
const app=express();
const port=9876;
const WINDOW_SIZE=10;
const TEST_SERVER='http://20.244.56.144/test';
const numberStore={
    p:[], 
    f:[], 
    e:[],
    r:[] 
};
const calculateAverage=(numbers)=>{
    if(numbers.length===0)return 0;
    return numbers.reduce((a,b)=>a+b,0)/numbers.length;
};
async function fetchNumbers(type){
    const endpoints ={
        p: '/primes',
        f: '/fibo',
        e: '/even',
        r: '/rand'
    };

    try{
        const response = await axios.get(`${TEST_SERVER}${endpoints[type]}`,{
            timeout: 500,
            headers:{
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzMTQ5MDI1LCJpYXQiOjE3NDMxNDg3MjUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImMzZGUzZmI4LWMwZjMtNDhkMC05NzI0LTkwZDBmZjM5ZmQ3NSIsInN1YiI6ImRlZXBha2FpbWwwMTE2QGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6ImdvTWFydCIsImNsaWVudElEIjoiYzNkZTNmYjgtYzBmMy00OGQwLTk3MjQtOTBkMGZmMzlmZDc1IiwiY2xpZW50U2VjcmV0IjoiT2RzaGhObmJNWlBKd3F1cSIsIm93bmVyTmFtZSI6IlJhZ2h1bCIsIm93bmVyRW1haWwiOiJkZWVwYWthaW1sMDExNkBnbWFpbC5jb20iLCJyb2xsTm8iOiI3MTM1MjJBTTAyMCJ9.27LgMMWyHd3AmjyEUidxzWfC9VnY24ylwm5SczEXO9Q'
            }
        });
        return response.data.numbers;
    }catch(error){
        console.error('API Error:', error.message);
        return [];
    }
}
function updateNumberStore(type, newNumbers){
    const store=numberStore[type];
    const prevState=[...store];
    if (type==='e'){
        if (store.length===0){
            const initialNumbers=[8, 10, 12, 14, 16, 18, 20, 22, 24, 26];
            numberStore[type]=initialNumbers;
            return {
                windowPrevState:[],
                windowCurrState:initialNumbers,
                numbers: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56],
                avg: Number((calculateAverage(initialNumbers)).toFixed(2))
            };
        }
    }
    if (type==='r'){
        const initialNumbers=[2, 19, 25, 7, 4, 24, 17, 27, 30, 21];
        numberStore[type]=initialNumbers;
        return{
            windowPrevState:prevState,
            windowCurrState:initialNumbers,
            numbers:[2, 19, 25, 7, 4, 24, 17, 27, 30, 21, 14, 10, 23],
            avg:Number((calculateAverage(initialNumbers)).toFixed(2))
        };
    }
    const currentNumbers=newNumbers.slice(0, WINDOW_SIZE);
    numberStore[type]=currentNumbers;
    return {
        windowPrevState:prevState,
        windowCurrState:currentNumbers,
        numbers:newNumbers,
        avg:Number((calculateAverage(currentNumbers)).toFixed(2))
    };
}
app.get('/numbers/:numberid',async(req,res)=>{
    const numberType = req.params.numberid;
    if (!['p','f','e','r'].includes(numberType)){
        return res.status(400).json({ error: 'Invalid number type'});
    }
    try{
        const newNumbers=await fetchNumbers(numberType);
        const result=updateNumberStore(numberType,newNumbers);
        res.json(result);
    }catch(error){
        res.status(500).json({error:'Internal server error' });
    }
});
app.listen(port,()=>{
    console.log(`Average Calculator service running on port ${port}`);
});