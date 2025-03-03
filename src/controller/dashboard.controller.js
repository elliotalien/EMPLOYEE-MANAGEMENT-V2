const Employee = require('../model/employee.model');
const User = require('../model/user.model');

const getDashboardData = async (req, res) => {
    try {
        // Get current user data
        const userData = await User.findById(req.session.userId).lean();
        if (!userData) {
            return res.redirect('/login');
        }

        const user = {
            name: userData.name || 'User',
            email: userData.email,
            profileImage: userData.profileImage ? userData.profileImage.url : 'https://res.cloudinary.com/dvlzuvwfe/image/upload/v1732951123/pngwing.com_hh3m4t.png'
        };

        // Add user filter to all queries
        const userFilter = { createdBy: req.session.userId };

        // Get total employees count and status breakdown
        const totalEmployees = await Employee.countDocuments(userFilter);
        console.log('Raw Employee Count:', totalEmployees);

        // Get status breakdown with department info
        const employeeBreakdown = await Employee.aggregate([
            { $match: userFilter },
            {
                $group: {
                    _id: {
                        status: '$status',
                        department: { 
                            $cond: [
                                { $or: [
                                    { $eq: ["$department", null] },
                                    { $eq: ["$department", ""] }
                                ]},
                                "Unassigned",
                                "$department"
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        console.log('Employee Breakdown:', JSON.stringify(employeeBreakdown, null, 2));

        const activeEmployees = await Employee.countDocuments({ ...userFilter, status: 'Active' });
        const onLeaveEmployees = await Employee.countDocuments({ ...userFilter, status: 'On Leave' });
        const inactiveEmployees = await Employee.countDocuments({ ...userFilter, status: 'Inactive' });

        // Debug: Check a few employee records
        const sampleEmployees = await Employee.find(userFilter)
            .select('firstName lastName salary status')
            .limit(5)
            .lean();

        console.log('Sample Employee Records:', JSON.stringify(sampleEmployees, null, 2));

        // Initialize salary ranges with job levels
        const salaryRanges = [
            { 
                min: 0, 
                max: 15000, 
                label: 'Entry Level',
                range: '₹0 - ₹15,000',
                count: 0,
                percentage: '0.0'
            },
            { 
                min: 15000, 
                max: 30000, 
                label: 'Junior Level',
                range: '₹15,000 - ₹30,000',
                count: 0,
                percentage: '0.0'
            },
            { 
                min: 30000, 
                max: 50000, 
                label: 'Mid Level',
                range: '₹30,000 - ₹50,000',
                count: 0,
                percentage: '0.0'
            },
            { 
                min: 50000, 
                max: 75000, 
                label: 'Senior Level',
                range: '₹50,000 - ₹75,000',
                count: 0,
                percentage: '0.0'
            },
            { 
                min: 75000, 
                max: 100000, 
                label: 'Expert Level',
                range: '₹75,000 - ₹100,000',
                count: 0,
                percentage: '0.0'
            },
            { 
                min: 100000, 
                max: Infinity, 
                label: 'Leadership Level',
                range: 'Above ₹100,000',
                count: 0,
                percentage: '0.0'
            }
        ];

        try {
            // Get all employees with valid salaries (Active and On Leave only)
            const employeesWithSalary = await Employee.find({
                ...userFilter,
                status: { $in: ['Active', 'On Leave'] },
                salary: { $exists: true, $ne: null }
            }).select('salary').lean();

            let totalSalary = 0;
            const totalEmployees = employeesWithSalary.length;

            // Process each employee's salary
            employeesWithSalary.forEach(emp => {
                const salary = parseInt(emp.salary, 10);
                if (!isNaN(salary)) {
                    totalSalary += salary;
                    // Find the appropriate salary range
                    const range = salaryRanges.find(r => salary >= r.min && salary < r.max);
                    if (range) {
                        range.count++;
                    }
                }
            });

            // Calculate percentages for each range
            salaryRanges.forEach(range => {
                range.percentage = totalEmployees > 0 ? 
                    ((range.count / totalEmployees) * 100).toFixed(1) : '0.0';
            });

            // Calculate average salary
            const avgSalaryPerEmployee = totalEmployees > 0 ? 
                Math.round(totalSalary / totalEmployees) : 0;

            // Format currency values
            const formattedTotalSalary = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(totalSalary);

            const formattedAvgSalary = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(avgSalaryPerEmployee);

            console.log('Salary Distribution:', {
                ranges: salaryRanges,
                totalEmployees,
                totalSalary: formattedTotalSalary,
                averageSalary: formattedAvgSalary
            });

            // Calculate monthly hiring trends
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = new Date().getFullYear();
            const hiringCounts = new Array(12).fill(0);

            const allEmployees = await Employee.find(userFilter)
                .sort({ createdAt: -1 })
                .lean();

            allEmployees.forEach(emp => {
                const hireDate = new Date(emp.joiningDate || emp.createdAt);
                if (hireDate.getFullYear() === currentYear) {
                    hiringCounts[hireDate.getMonth()]++;
                }
            });

            // Calculate activity rate and status
            let activityRate = 0;
            let activityStatus = 'No Data';
            let targetRate = 90;

            try {
                activityRate = totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : 0;
                activityRate = parseFloat(activityRate);
                activityStatus = activityRate >= targetRate ? 'On Track' : 
                               activityRate >= 70 ? 'Near Target' : 'Below Target';
            } catch (err) {
                console.error('Error calculating activity rate:', err);
                activityRate = 0;
                activityStatus = 'Error';
            }

            // Get department statistics
            let departmentDistribution = [];
            let departmentCount = 0;
            try {
                // Get all departments (excluding null and empty)
                const departmentsList = await Employee.distinct('department', {
                    ...userFilter,
                    department: { $exists: true, $ne: '' }
                });

                departmentCount = departmentsList.length;

                // Calculate department counts and percentages
                const departmentStats = await Promise.all(
                    departmentsList.map(async dept => {
                        const count = await Employee.countDocuments({
                            ...userFilter,
                            department: dept
                        });
                        return {
                            name: dept,
                            count,
                            percentage: totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : '0.0',
                            color: `hsl(${Math.random() * 360}, 70%, 50%)`  // Random color for each department
                        };
                    })
                );

                // Sort departments by count in descending order
                departmentDistribution = departmentStats.sort((a, b) => b.count - a.count);

                console.log('Department Distribution:', departmentDistribution);

            } catch (err) {
                console.error('Error calculating department statistics:', err);
                departmentDistribution = [];
                departmentCount = 0;
            }

            // Get recent employees (last 5)
            const recentEmployees = allEmployees
                .slice(0, 5)
                .map(emp => ({
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    department: emp.department || 'Unassigned',
                    status: emp.status || 'Active',
                    salary: emp.salary || 0
                }));

            // Get all recent activities without limit
            const recentActivities = await Employee.find(userFilter)
                .sort({ updatedAt: -1 })
                .select('firstName lastName department status createdAt updatedAt previousDepartment departmentChangeDate')
                .lean();

            const formattedActivities = recentActivities.map(emp => {
                const isDepartmentChange = emp.previousDepartment && emp.departmentChangeDate;
                const activityDate = isDepartmentChange ? 
                    new Date(emp.departmentChangeDate) : 
                    new Date(emp.createdAt);
                
                // Format the date
                const formattedDate = activityDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                // Format the time
                const formattedTime = activityDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return {
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    department: emp.department || 'Unassigned',
                    previousDepartment: emp.previousDepartment,
                    status: emp.status,
                    type: isDepartmentChange ? 'department_change' : 'new_join',
                    timestamp: formattedDate,
                    time: formattedTime
                };
            });

            // Sort activities by date (most recent first)
            formattedActivities.sort((a, b) => {
                const dateA = new Date(a.timestamp + ' ' + a.time);
                const dateB = new Date(b.timestamp + ' ' + b.time);
                return dateB - dateA;
            });

            console.log('Recent Activities:', formattedActivities);

            // Prepare and send the dashboard data
            try {
                const dashboardData = {
                    user,
                    stats: {
                        total: totalEmployees,
                        active: activeEmployees,
                        onLeave: onLeaveEmployees,
                        inactive: inactiveEmployees,
                        totalSalary: formattedTotalSalary,
                        avgSalary: formattedAvgSalary,
                        departmentCount: departmentCount,
                        mostActiveDepartment: departmentDistribution.length > 0 ? departmentDistribution[0].name : 'N/A',
                        activeRate: activityRate,
                        targetRate: targetRate,
                        activeStatus: activityStatus,
                        departmentDistribution,
                        monthlyHiring: {
                            labels: months,
                            data: hiringCounts
                        },
                        recentEmployees,
                        recentActivities: formattedActivities,
                        salaryDistribution: salaryRanges
                    }
                };

                console.log('Dashboard data prepared successfully');
                return dashboardData;

            } catch (error) {
                console.error('Error preparing dashboard data:', error);
                throw error;
            }
        } catch (err) {
            console.error('Error calculating salary statistics:', err);
            console.error('Error details:', err.message);
            console.error('Stack trace:', err.stack);
        }
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        throw error;
    }
};

// Helper Functions
function formatTimeAgo(date) {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }
    return 'Just now';
}

function formatMonthlyTrends(trends) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentDate);
        date.setMonth(currentDate.getMonth() - i);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: `${months[date.getMonth()]} ${date.getFullYear()}`
        };
    }).reverse();

    return last12Months.map(month => {
        const trend = trends.find(t => 
            t._id.year === month.year && t._id.month === month.month
        );
        return {
            label: month.label,
            count: trend?.count || 0
        };
    });
}

function formatSalary(amount) {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

module.exports = {
    getDashboardData
};