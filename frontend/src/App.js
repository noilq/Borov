import React, { useEffect, useState } from 'react'

function App() {

  const [users, setUsers] = useState([])

  useEffect( () => {
    fetch("/user/").then(
      res => res.json()
    ).then(
      data => {
        console.log(data)
        setUsers(data)
      }
    )
  }, [])

  return (
    <div>
    {
      users.map((user, index) => (
        <div key={index}>
          <p>Login: {user.login}</p>
          <p>Name: {user.name}</p> 
        </div>
      ))
    }
      
    </div>
  )
}

export default App