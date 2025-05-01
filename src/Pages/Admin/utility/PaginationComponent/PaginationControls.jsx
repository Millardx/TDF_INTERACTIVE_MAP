import React, { useState } from 'react';
import ReactPaginate from 'react-paginate';
import styles from './styles/paginationStyles.module.scss';

export default function PaginationControls({
    data,
    rowsPerPageOptions = [5, 10, 15, 20],
    onFilterChange,
    onPaginationChange,
    placeholder = "Search..."
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [logsPerPage, setLogsPerPage] = useState(rowsPerPageOptions[0]);
    const [currentPage, setCurrentPage] = useState(0);

    // Handle search
    const handleSearchChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
        setCurrentPage(0); 
        onFilterChange(term, logsPerPage, 0); 
    };

    // Handle rows per page
    const handleLimitChange = (event) => {
        const limit = Number(event.target.value);
        setLogsPerPage(limit);
        setCurrentPage(0); 
        onFilterChange(searchTerm, limit, 0); 
    };

    // Handle pagination
    const handlePageClick = (event) => {
        const newPage = event.selected;
        setCurrentPage(newPage);
        onPaginationChange(newPage); 
    };

    return (
        <>
            <div className = {styles.searchFilter}>
                <label htmlFor = "search" className = {`${styles.txtSubTitle} ${styles.searchLabel}`}>
                    Search:
                </label>
                <input
                    id = "search"
                    type = "text"
                    placeholder = { placeholder }
                    value = { searchTerm }
                    onChange = { handleSearchChange }
                    className = { styles.searchInput }
                />
            </div>
            <div className = { styles.controls }>
                <div className = { styles.rowsPerPage }>
                    <label htmlFor = "rowsPerPage" className = {`${styles.txtSubTitle} ${styles.limitLabel}`}>
                        Rows per page:
                    </label>
                    <select
                        id = "rowsPerPage"
                        value = { logsPerPage }
                        onChange = { handleLimitChange }
                        className = { styles.limitSelect }
                    >
                        {rowsPerPageOptions.map((option) => (
                            <option key = { option } value = { option }>
                                { option }
                            </option>
                        ))}
                    </select>
                </div>
                
                <ReactPaginate
                    previousLabel = { 'Previous' }
                    nextLabel = { 'Next' }
                    breakLabel = { '...' }
                    pageCount = { Math.ceil(data.length / logsPerPage) }
                    marginPagesDisplayed = { 2 }
                    pageRangeDisplayed = { 3 }
                    onPageChange = { handlePageClick }
                    containerClassName = { styles.pagination }
                    activeClassName = { styles.active }
                    pageClassName = { styles.pageItem }
                    previousClassName = { styles.pageItem }
                    nextClassName = { styles.pageItem }
                    breakClassName = { styles.pageItem }
                />
            </div>
        </>
    );
}
