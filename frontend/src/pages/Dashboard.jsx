import React from 'react'
import Header2 from '../components/Header2'
import { Outlet } from 'react-router-dom'

const Dashboard = () => {
  return (
    <div>
      <Header2 />
      <div className="section-container pt-2">
        <Outlet />
      </div>
    </div>
  )
}

export default Dashboard