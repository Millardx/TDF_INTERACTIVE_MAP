import {Chart as ChartJS, defaults } from 'chart.js/auto';
import { Bar, Doughnut } from 'react-chartjs-2';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaginationControls from '../utility/PaginationComponent/PaginationControls';
import moment from 'moment';

import NavBar from './navBar/NavBar';
import styles from './styles/analyticsStyle.module.scss';
import {API_URL } from '/src/config';

defaults.maintainAspectRatio = false;
defaults.responsive = true; 

export default function Analytics() {
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

    //Millard 4-28 refactoring fetching and added the countFeedback function
    // ✅ Fetch Analytics Data
    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`${API_URL}/api/guest/analytics`);
            const data = await response.json();
            console.log("Fetched Analytics:", data);

            setStarFeedback(data.ratings);
            setSexDistribution(data.sexes);
            setRoleDistribution(data.roles);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    // ✅ Fetch Guest Logs Data
    const fetchGuestLogs = async () => {
        try {
            const response = await fetch(`${API_URL}/api/guest/guestLogs`);
            const data = await response.json();
            setGuestLogs(data);
            setFilteredLogs(data); 
            setCurrentLogs(data.slice(0, logsPerPage));
            // added by Lorenzo @ 05/01/2025
            filterLogsByTimeframe(data, selectedTimeframe);
        } catch (error) {
            console.error('Error fetching guest logs:', error);
        }
    };

        // added by lorenzo - data graph filter and feedback list - 05/01/2025 
        const filterLogsByTimeframe = (logs, timeframe) => {
            const now = moment();
            let filtered = logs;
    
            if (timeframe === '30days') {
                filtered = logs.filter(log => moment(log.feedback?.feedbackDate).isAfter(now.clone().subtract(30, 'days')));
            } else if (timeframe === '6months') {
                filtered = logs.filter(log => moment(log.feedback?.feedbackDate).isAfter(now.clone().subtract(6, 'months')));
            } else if (timeframe === 'year') {
                filtered = logs.filter(log => moment(log.feedback?.feedbackDate).isSame(now, 'year'));
            }
    
            setFilteredLogs(filtered);
            setCurrentLogs(filtered.slice(0, logsPerPage));
    
            // Generate chart datasets from filtered logs
            const starMap = {};
            const sexMap = {};
            const roleMap = {};
            const monthMap = Array(12).fill(0);
    
            filtered.forEach(log => {
                const rating = log.feedback?.rating;
                if (rating) starMap[rating] = (starMap[rating] || 0) + 1;
    
                const sex = log.sexAtBirth;
                if (sex) sexMap[sex] = (sexMap[sex] || 0) + 1;
    
                const role = log.role === 'Others' ? log.customRole || 'Others' : log.role;
                if (role) roleMap[role] = (roleMap[role] || 0) + 1;
    
                const month = moment(log.feedback?.feedbackDate).month();
                monthMap[month]++;
            });
    
            setStarFeedback(Object.keys(starMap).map(key => ({ label: `${key} Star`, value: starMap[key] })));
            setSexDistribution(Object.keys(sexMap).map(key => ({ label: key, value: sexMap[key] })));
            setRoleDistribution(Object.keys(roleMap).map(key => ({ label: key, value: roleMap[key] })));
            setMonthlyViews(monthMap);
        };
    
    
    // pagination
    const handleFilterChange = (searchTerm, limit, currentPage) => {
        const now = moment();
        let logsToFilter = guestLogs;

        if (selectedTimeframe === '30days') {
            logsToFilter = logsToFilter.filter(log => moment(log.feedback?.feedbackDate).isAfter(now.clone().subtract(30, 'days')));
        } else if (selectedTimeframe === '6months') {
            logsToFilter = logsToFilter.filter(log => moment(log.feedback?.feedbackDate).isAfter(now.clone().subtract(6, 'months')));
        } else if (selectedTimeframe === 'year') {
            logsToFilter = logsToFilter.filter(log => moment(log.feedback?.feedbackDate).isSame(now, 'year'));
        }

        const filtered = logsToFilter.filter((log) =>
            [log.role, log.sexAtBirth, log.feedback?.rating, log.feedback?.comment]
                .map((value) => value?.toString().toLowerCase())
                .some((value) => value?.includes(searchTerm.toLowerCase()))
        );

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
        fetchAnalytics();
        fetchGuestLogs();
        fetchCountFeedback(); // New fetch for count feedback
    }, [logsPerPage, selectedTimeframe]);

    // ✅ Manage page-specific styling
    useEffect(() => {
        const rootDiv = document.getElementById("root");
        if (location.pathname === "/analytics") {
            rootDiv.classList.add(styles.rootDiv);
        } else {
            rootDiv.classList.remove(styles.rootDiv);
        }
    }, [location]);

    return (
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
                            Total Count: <span className = {`${styles.txtSubTitle} ${styles.totalCount}`}> 100 </span>
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
                                        data: [120, 150, 180, 90, 250, 300, 270, 220, 200, 180, 160, 190],
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

                        <table>
                            <thead>
                                <tr>
                                    {/* <th>GUEST ID</th> */}
                                    <th>ROLE</th>
                                    <th>SEX</th>
                                    <th>RATING</th>
                                    <th>COMMENT</th>
                                    <th>DATE & TIME</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLogs.map((log, index) => (
                                    <tr key={index}>
                                        {/* <td>{log.guestId}</td> */}
                                        <td>{log.role === "Others" ? log.customRole || "N/A" : log.role}</td>
                                        <td>{log.sexAtBirth}</td>
                                        <td>{log.feedback?.rating ? `${log.feedback.rating} Stars` : 'No Rating'}</td>
                                        <td>{log.feedback?.comment || 'No Comment'}</td>
                                        <td>
                                            {moment(log.feedback?.feedbackDate).format('MMM D, YYYY,')}
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
    )
}