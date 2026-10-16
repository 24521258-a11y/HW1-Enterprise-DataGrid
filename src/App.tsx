
import { useState } from 'react'
import DataGrid from './components/DataGrid'
import type { ColumnDef } from './components/DataGrid'
import './App.css'

type Student = {
  id: number
  name: string
  email: string
  department: string
}

const students: Student[] = [
  { id: 1, name: 'Nguyen Van An', email: 'an@example.com', department: 'IT' },
  { id: 2, name: 'Tran Thi Binh', email: 'binh@example.com', department: 'Business' },
  { id: 3, name: 'Le Minh Khoa', email: 'khoa@example.com', department: 'IT' },
  { id: 4, name: 'Pham Ngoc Mai', email: 'mai@example.com', department: 'Finance' },
  { id: 5, name: 'Hoang Gia Bao', email: 'bao@example.com', department: 'IT' },
  { id: 6, name: 'Do Thanh Nhi', email: 'nhi@example.com', department: 'Marketing' },
]

const columns: ColumnDef<Student>[] = [
  { header: 'ID', accessorKey: 'id', sortable: true },
  { header: 'Name', accessorKey: 'name', sortable: true },
  { header: 'Email', accessorKey: 'email', sortable: true },
  { header: 'Department', accessorKey: 'department', sortable: true },
]

function App() {
  const [lastSelected, setLastSelected] = useState<string>('')

  return (
    <main className="container">
      <h1>Enterprise Data Grid</h1>
      <p>Accessible Student Management System</p>

      <DataGrid<Student>
        data={students}
        columns={columns}
        ariaLabel="Student management data grid"
        onRowSelect={(student) => setLastSelected(student.name)}
      />

      {lastSelected && (
        <p className="selection-status" aria-live="polite">
          Last selected student: {lastSelected}
        </p>
      )}
    </main>
  )
}

export default App
