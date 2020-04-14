function test(t) {      //defining a function
  if (t === undefined) {       //if t=undefined, call tt
        console.log(t.tt)      //call tt member from t
  }
  return t;    
}
var a;    //a is a variable with undefined value
console.log(test(a)); //function call
