import {Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut } from 'react-chartjs-2';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaginationControls from '../utility/PaginationComponent/PaginationControls';
import moment from 'moment';

import NavBar from './navBar/NavBar';
import styles from './styles/analyticsStyle.module.scss';
import {API_URL } from '/src/config';

//loading content
import useLoading from '../utility/PageLoaderComponent/useLoading';
import LoadingAnim from '../utility/PageLoaderComponent/LoadingAnim';

defaults.maintainAspectRatio = false;
defaults.responsive = true; 

export default function Analytics() {
    const [isLoading, setIsLoading] = useLoading(true);     // For loading
    const location = useLocation();
    const [starFeedback, setStarFeedback] = useState([]);
    const [sexDistribution, setSexDistribution] = useState([]);
    const [roleDistribution, setRoleDistribution] = useState([]);
    const [guestLogs, setGuestLogs] = useState([]);

    // for pagination 
    const [currentLogs, setCurrentLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [logsPerPage, setLogsPerPage] = useState(5);

    // Added by Lorenzo - 05/01/2025
    // for data graph filter
    const [selectedTimeframe, setSelectedTimeframe] = useState('all');
    const [monthlyViews, setMonthlyViews] = useState([]);
    const [commentFilter, setCommentFilter] = useState('all'); // 'all', 'with', 'without'

    // Added by Lorenzo - 05/19/2025
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const reloaded = sessionStorage.getItem('hasReloaded');
        
        console.log('value', reloaded);

        if (!reloaded) {
            sessionStorage.setItem('hasReloaded', 'true');
            window.location.reload();   // Force reload before rendering
        } else {
            sessionStorage.removeItem('hasReloaded'); // Clean up
            setShouldRender(true);      // Allow rendering after reload
        }
    }, []);


    //Millard 4-28 refactoring fetching and added the countFeedback function
   

    // ✅ Fetch Guest Logs Data
    const fetchGuestLogs = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/guest/guestLogs`);
            const data = await response.json();
            const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setGuestLogs(sorted);
            generateMonthlyViewsFromCreatedAt(data);
            setFilteredLogs(sorted);
            setCurrentLogs(sorted.slice(0, logsPerPage));
            // added by Lorenzo @ 05/01/2025
            filterLogsByTimeframe(data, selectedTimeframe);
        } catch (error) {
            console.error('Error fetching guest logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateMonthlyViewsFromCreatedAt = (logs) => {
        const monthMap = Array(12).fill(0); // Jan to Dec
        logs.forEach(log => {
            if (log.createdAt) {
                const month = moment(log.createdAt).month(); // 0 = Jan
                monthMap[month]++;
            }
        });
        setMonthlyViews(monthMap);
    };
    

        // added by lorenzo - data graph filter and feedback list - 05/01/2025 
    const filterLogsByTimeframe = (logs, timeframe) => {
        const now = moment();
        let filtered = [];
    
        logs.forEach(log => {
            const date = log.createdAt ? moment(log.createdAt) : null;
            if (date && date.isValid()) {
                log._effectiveDate = date.toDate();
            }
        });
    
        if (timeframe === '30days') {
            filtered = logs.filter(log =>
                moment(log._effectiveDate).isAfter(now.clone().subtract(30, 'days'))
            );
        } else if (timeframe === '6months') {
            filtered = logs.filter(log =>
                moment(log._effectiveDate).isAfter(now.clone().subtract(6, 'months')) &&
                moment(log._effectiveDate).isSame(now, 'year') // 🛠 Fix: ensure same year
            );
        } else if (timeframe === 'year') {
            filtered = logs.filter(log =>
                moment(log._effectiveDate).isSame(now, 'year')
            );
        } else {
            filtered = logs;
        }
    
        filtered.sort((a, b) => new Date(b._effectiveDate) - new Date(a._effectiveDate));
        const withFeedback = filtered.filter(log => log.feedback?.rating != null);
        setFilteredLogs(withFeedback);
        setCurrentLogs(withFeedback.slice(0, logsPerPage));
    
        // 🟢 Update Line Chart - all logs
        const monthMap = Array(12).fill(0);
        filtered.forEach(log => {
            const month = moment(log._effectiveDate).month();
            monthMap[month]++;
        });
        setMonthlyViews(monthMap);
    
        // 🟠 Only logs WITH feedback
        const logsWithFeedback = filtered.filter(log => log.feedback?.rating != null);
    
        // Update star feedback
        const starMap = {};
        const sexMap = {};
        const roleMap = {};
        
        logsWithFeedback.forEach(log => {
            const rating = log.feedback?.rating;
            if (rating) starMap[rating] = (starMap[rating] || 0) + 1;
    
            const sex = log.sexAtBirth;
            if (sex) sexMap[sex] = (sexMap[sex] || 0) + 1;
    
            const roleLabel = log.role === 'Others' ? 'Others' : log.role;
            if (roleLabel) {
              roleMap[roleLabel] = (roleMap[roleLabel] || 0) + 1;
            }
        });
    
        setStarFeedback(Object.entries(starMap).map(([label, value]) => ({ label: `${label} Star`, value })));
        setSexDistribution(Object.entries(sexMap).map(([label, value]) => ({ label, value })));
        setRoleDistribution(Object.entries(roleMap).map(([label, value]) => ({ label, value })));

        console.log(`🟢 Timeframe Filter: ${timeframe.toUpperCase()}`);
        console.log(`🔢 Total Logs (All): ${logs.length}`);
        console.log(`🔍 Filtered Logs (After Date Filter): ${filtered.length}`);

        console.log(`⭐ Logs WITH Feedback: ${withFeedback.length}`);

    };
    
    
    
    // pagination
    const handleFilterChange = (searchTerm, limit, currentPage) => {

        let logsToFilter = filteredLogs.filter(log => log.feedback?.rating != null);

            // 🔁 Apply comment filter
            if (commentFilter === 'with') {
                logsToFilter = logsToFilter.filter(log => log.feedback?.comment && log.feedback.comment.trim() !== '');
            } else if (commentFilter === 'without') {
                logsToFilter = logsToFilter.filter(log => !log.feedback?.comment || log.feedback.comment.trim() === '');
            } // Filter logs based on search term and limit

        const filtered = filteredLogs
            .filter(log => log.feedback?.rating != null) // only logs with feedback
            .filter((log) =>
                [log.role, log.sexAtBirth, log.feedback?.rating, log.feedback?.comment]
                    .map((value) => value?.toString().toLowerCase())
                    .some((value) => value?.includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => new Date(b.feedback?.feedbackDate || b._effectiveDate) - new Date(a.feedback?.feedbackDate || a._effectiveDate));
    
        setLogsPerPage(limit);
        setFilteredLogs(filtered);
        setCurrentLogs(filtered.slice(currentPage * limit, currentPage * limit + limit));
    };
    

    const handlePaginationChange = (currentPage) => {
        const offset = currentPage * logsPerPage;
        setCurrentLogs(filteredLogs.slice(offset, offset + logsPerPage));

    };

    // ✅ Fetch Count Feedback Data (new handler)
    const fetchCountFeedback = async () => {
        try {
            const response = await fetch(`${API_URL}/api/guest/guestLogs/countFeedback`);
            const data = await response.json();
            console.log('Fetched Count Feedback:', data);
        } catch (error) {
            console.error('Error fetching count feedback:', error);
        }
    };

    

    // ✅ Run All Fetches on Mount
    useEffect(() => {
        fetchGuestLogs();
        fetchCountFeedback(); // New fetch for count feedback
    }, [logsPerPage, selectedTimeframe]);

    // ✅ Re-filter logs when commentFilter changes
    useEffect(() => {
        if (commentFilter === 'with' || commentFilter === 'without') {
            setLogsPerPage(20); // Set to 20 only on filter
            handleFilterChange('', 20, 0); // Reset page and re-filter
        }
    }, [commentFilter]);
    
    

    // ✅ Manage page-specific styling
    useEffect(() => {
        const rootDiv = document.getElementById("root");
        if (location.pathname === "/analytics") {
            rootDiv.classList.add(styles.rootDiv);
        } else {
            rootDiv.classList.remove(styles.rootDiv);
        }
    }, [location]);


    // Added by lorenzo - 05/19/2025
    if (!shouldRender) return null;     // Skip render until reload has occurred

    return (
        <>
            {isLoading ? (
                <LoadingAnim message="Loading data..." />
            ) : (
                <>
                    <NavBar />

                    <div className = { styles.analyticsContainer }>
                        <div className={styles.header}>
                            <span className = { styles.txtTitle }>Analytics</span>
                        </div>

                        <span className = { `${ styles.txtTitle} ${ styles.chartHeader }` }>Data Charts</span>

                        {/* added by Lorenzo 05/01/2025 */}
                        <span className = { `${ styles.txtTitle} ${ styles.filterHeader }` }>Filters</span>
                        <div className={styles.timeframeButtons}>
                            <button
                                className={`${selectedTimeframe === 'all' ? styles.active : ''}`}
                                onClick={() => setSelectedTimeframe('all')}
                            >
                                All Time
                            </button>
                            <button
                                className={`${selectedTimeframe === '30days' ? styles.active : ''}`}
                                onClick={() => setSelectedTimeframe('30days')}
                            >
                                Last 30 Days
                            </button>
                            <button
                                className={`${selectedTimeframe === '6months' ? styles.active : ''}`}
                                onClick={() => setSelectedTimeframe('6months')}
                            >
                                Last 6 Months
                            </button>
                            <button
                                className={`${selectedTimeframe === 'year' ? styles.active : ''}`}
                                onClick={() => setSelectedTimeframe('year')}
                            >
                                This Year
                            </button>
                        </div>
                        
                        <div className={styles.chartCont0}>
                            <div className={styles.lineChart}>
                                <span className={`${styles.txtTitle} ${styles.chartTitle}`}>Monthly Website Views</span><br/>

                                {/* replace with actual data */}
                                <span className = {`${styles.txtTitle} ${styles.totaltitle}`}>
                                    Total Count: <span className = {`${styles.txtSubTitle} ${styles.totalCount}`}> 
                                    {monthlyViews.reduce((sum, val) => sum + val, 0)} </span>
                                </span>
                                <div className={styles.wrapper}>
                                <Bar
                                    data={{
                                        labels: [
                                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                                        ],
                                        datasets: [
                                            {
                                                label: 'Website Views',
                                                data: monthlyViews,
                                                fill: false,
                                                tension: 0.4,
                                                borderColor: 'rgba(75, 192, 192, 1)',
                                                backgroundColor: 'rgba(75, 192, 192, 0.3)',
                                                pointBorderColor: 'rgba(75, 192, 192, 1)',
                                                pointBackgroundColor: 'white',
                                                pointRadius: 5,
                                                borderWidth: 2,
                                                type: 'line'
                                            }
                                        ],
                                    }}
                                    options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                        display: true,
                                        position: 'top',
                                        },
                                    },
                                    scales: {
                                        x: {
                                        title: {
                                            display: true,
                                            text: 'Month'
                                        }
                                        },
                                        y: {
                                        title: {
                                            display: true,
                                            text: 'Views'
                                        },
                                        beginAtZero: true
                                        }
                                    },
                                    }}
                                />
                                </div>
                            </div>
                        </div>

                        <div className = { styles.chartCont1 }>
                            <div className = { styles.stars }>
                                <span className = { `${styles.txtTitle} ${styles.chartTitle}` }>Star Feedback</span>
                                <div className = { styles.wrapper }>
                                <Doughnut
                                        data={{
                                            labels: starFeedback.map((item) => item.label),
                                            datasets: [
                                                {
                                                    label: 'Count',
                                                    data: starFeedback.map((item) => item.value),
                                                    borderRadius: 5,
                                                    backgroundColor: [
                                                        'rgba(255, 99, 132, 0.8)',
                                                        'rgba(54, 162, 235, 0.8)',
                                                        'rgba(255, 206, 86, 0.8)',
                                                        'rgba(75, 192, 192, 0.8)',
                                                        'rgba(153, 102, 255, 0.8)',
                                                    ],
                                                },
                                            ],
                                        }}
                                    />
                                </div>
                            </div>                      
                        </div>

                        <div className = { styles.chartCont2 }>
                            <div className = { styles.sex }>
                                <span className = {`${styles.txtTitle} ${styles.chartTitle}`}>Respondents' Sex</span>
                                <div className = { styles.wrapper }>
                                <Bar
                                        data={{
                                            labels: sexDistribution.map((item) => item.label),
                                            datasets: [
                                                {
                                                    label: 'Count',
                                                    data: sexDistribution.map((item) => item.value),

                                                    backgroundColor: [
                                                        'rgba(54,162,235, 1)',
                                                        'rgba(255,99,132, 1)',
                                                        'rgba(153, 102, 255, 1)',
                                                    ],
                                                    borderRadius: 5,
                                                },
                                            ],
                                        }}

                                        options={{
                                            plugins: {
                                                legend: {
                                                    display: false, // Hides the legend
                                                },
                                            },
                                            scales: {
                                                x: {
                                                    ticks: {
                                                        display: true, // show x-axis labels
                                                    },
                                                },
                                                y: {
                                                    ticks: {
                                                        display: true, // show y-axis labels
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                            <div className = { styles.role }>
                                <span className = {`${styles.txtTitle} ${styles.chartTitle}`}>Respondents' Role</span>
                                <div className = { styles.wrapper }>
                                <Bar
                                        data={{
                                            labels: roleDistribution.map((item) => item.label),
                                            datasets: [
                                                {
                                                    label: 'Count',
                                                    data: roleDistribution.map((item) => item.value),
                                                    
                                                    backgroundColor: [
                                                        'rgba(54,162,235, 1)',
                                                        'rgba(255,99,132, 1)',
                                                        'rgba(75,192,192, 1)',
                                                        'rgba(255,159,64, 1)',
                                                    ],
                                                    borderRadius: 5,
                                                },
                                            ],
                                        }}

                                        options={{
                                            plugins: {
                                                legend: {
                                                    display: false, // Hides the legend
                                                },
                                            },
                                            scales: {
                                                x: {
                                                    ticks: {
                                                        display: true, // show x-axis labels
                                                    },
                                                },
                                                y: {
                                                    ticks: {
                                                        display: true, // show y-axis labels
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className = { styles.feedbackList}>
                            <span className = { `${ styles.txtTitle} ${ styles.feedbackHeader }` }>Feedback List</span>
                            <div className = { styles.tblWrapper }>

                                <PaginationControls
                                    data={filteredLogs}
                                    rowsPerPageOptions={[5, 10, 15, 20]}
                                    onFilterChange={handleFilterChange}
                                    onPaginationChange={handlePaginationChange}
                                />
                                
                                <div className={styles.commentToggleButtons}>
                                    <button
                                        className={commentFilter === 'all' ? styles.active : ''}
                                        onClick={() => setCommentFilter('all')}
                                    >
                                        All Feedback
                                    </button>
                                    <button
                                        className={commentFilter === 'with' ? styles.active : ''}
                                        onClick={() => setCommentFilter('with')}
                                    >
                                        With Comment
                                    </button>
                                    <button
                                        className={commentFilter === 'without' ? styles.active : ''}
                                        onClick={() => setCommentFilter('without')}
                                    >
                                        Without Comment
                                    </button>
                                </div>


                                <table>
                                    
                                    <thead>
                                        <tr>
                                            <th>No.</th>
                                            <th>ROLE</th>
                                            <th>SEX</th>
                                            <th>RATING</th>
                                            <th>COMMENT</th>
                                            <th>DATE & TIME</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {currentLogs
                                            .filter((log) => {
                                                const hasComment = !!log.feedback?.comment?.trim();
                                                if (commentFilter === 'with') return hasComment;
                                                if (commentFilter === 'without') return !hasComment;
                                                return true; // 'all'
                                            })
                                            
                                            .map((log, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td> {/* ✅ Number column */}
                                                <td>{log.role === "Others" ? log.customRole || "N/A" : log.role}</td>
                                                <td>{log.sexAtBirth}</td>
                                                <td>{log.feedback?.rating ? `${log.feedback.rating} Stars` : 'No Rating'}</td>
                                                <td>{log.feedback?.comment || 'No Comment'}</td>
                                                <td>
                                                    {moment(log.feedback?.feedbackDate || log.createdAt).format('MMM D, YYYY,')}
                                                    <br />
                                                    {moment(log.feedback?.feedbackDate).format('h:mm A')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}