import { Session } from 'next-auth'
import React from 'react'

const Header = ({session}: {session: Session}) => {
  return <header className='admin-header'>
    <div>
        <h2 className='text-2xl font-semibold text-dark-400'>{session?.user?.name}</h2>
        <p  className='text-slate-500 text-base'>Monitor all of your users and books here</p>
    </div>

    <p>search</p>
  </header>
}

export default Header