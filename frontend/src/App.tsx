
import { Routes,Route } from 'react-router-dom'
import Terminal from './Component/Terminal'
import Home from './Component/Home'


function App() {


  return (
    <>
      <Routes>
        <Route path='/' element  ={<Home/>} />
        <Route path='/:id' element={<Terminal/>} />
        
      </Routes>
    </>
  )
}

export default App
