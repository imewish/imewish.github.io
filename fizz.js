function fizzBuzz(n) {
    // Write your code here
    let range = n => [...Array(n).keys()]
    let rangeArr = range(5)
     
     rangeArr.map(el => {
         el = el + 1
         if((el % 3) === 0 && (el % 5) === 0) {
             console.log(el , (el % 3), (el % 5))
             console.log('FizzBuzz')
         } else if ( (el %3 ) === 0 && (el % 5) !=0 ) {
             console.log(el, (el % 3), (el % 5))
             console.log('Fizz')
         } else if ((el % 5) === 0 && (el % 3) != 0) {
             console.log(el, (el % 3), (el % 5))
             console.log('Buzz')
         } else if ( (el % 3) != 0 && (el % 5) !=0) {
             console.log(el, (el % 3), (el % 5))
             console.log(el)
         }
     })
}

fizzBuzz()