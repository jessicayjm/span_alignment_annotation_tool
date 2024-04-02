import React, { useState, useEffect } from 'react';
import { useTable, usePagination } from 'react-table'

function TextTable({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    usePagination
  )
  
  return (
    <>
    <div className="pagination" style={{"align":"left"}}>
        <button className="custom-button nav-button"
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}>
          {"<<"}
          {/* <div className="button-arrow button-arrow-left"
               style={{"display": "flex"}}></div> */}
        </button>{' '}
        <button className="custom-button nav-button" 
                onClick={() => previousPage()} 
                disabled={!canPreviousPage}>
          {/* <div className="button-arrow button-arrow-left"></div> */}
          {"<"}
        </button>{' '}
        <button className="custom-button nav-button"
                onClick={() => nextPage()}
                disabled={!canNextPage}>
          {/* <div className="button-arrow button-arrow-right"></div> */}
          {">"}
        </button>
        <button className="custom-button nav-button"
                style={{"display":"flex"}}
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}>
          {/* <div className="button-arrow button-arrow-right"
               style={{"display": "flex"}}></div>
          {"|"} */}
          {">>"}
        </button>{' '}
        <span style={{color: 'white'}}>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span style={{color: 'white'}}>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        {/* <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select> */}
      </div>
      <table {...getTableProps()} className="textTable">
        <thead className="textHead">
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()} className='text'>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()} className='text center-text'>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      
    </>
  )
}

export default TextTable;