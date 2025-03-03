const User = require('../model/user.model');
const { getDashboardData } = require('./dashboard.controller');
const Employee = require('../model/employee.model');
const employeeService = require('../services/employee.service');
const userService = require('../services/user.service');

exports.HomeRoute = async (req, res) => {
    try {
        const dashboardData = await getDashboardData(req, res);
        const user = await User.findById(req.session.userId);
        
        res.render('dashboard', { 
            title: 'Dashboard',
            stats: {
                total: dashboardData.stats.total,
                active: dashboardData.stats.active,
                onLeave: dashboardData.stats.onLeave,
                inactive: dashboardData.stats.inactive,
                totalSalary: dashboardData.stats.totalSalary,
                avgSalary: dashboardData.stats.avgSalary,
                departmentCount: dashboardData.stats.departmentCount,
                mostActiveDepartment: dashboardData.stats.mostActiveDepartment,
                activeRate: dashboardData.stats.activeRate,
                targetRate: dashboardData.stats.targetRate,
                activeStatus: dashboardData.stats.activeStatus,
                departmentDistribution: dashboardData.stats.departmentDistribution,
                monthlyHiring: dashboardData.stats.monthlyHiring,
                recentEmployees: dashboardData.stats.recentEmployees,
                recentActivities: dashboardData.stats.recentActivities,
                salaryDistribution: dashboardData.stats.salaryDistribution || []
            },
            user: userService.formatUserResponse(user)
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/error');
    }
};

exports.SignupRoute = (req, res) => {
    res.render('signup', { title: 'Sign Up' });
};

exports.LoginRoutes = (req, res) => {
    res.render('login', { title: 'Login' });
};

exports.ViewEmployeeRoutes = async (req, res) => {
    try {
        const [user, employee] = await Promise.all([
            User.findById(req.session.userId),
            Employee.findById(req.params.id)
        ]);

        if (!user) {
            return res.redirect('/login');
        }

        if (!employee) {
            req.flash('error', 'Employee not found');
            return res.redirect('/employees');
        }

        const imageUrl = employee.imageUrl;

        res.render('viewEmployee', {
            title: 'View Employee',
            employee: employee,
            user: userService.formatUserResponse(user),
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('View employee error:', error);
        req.flash('error', 'Error viewing employee');
        res.redirect('/employees');
    }
};

exports.verifyUserEmail = (req, res) => {
    res.render('verify-email', { title: 'Verify Email' });
};

exports.ProfileRoute = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }
        
        res.render('profile', { 
            title: 'User Profile',
            user: userService.formatUserResponse(user)
        });
    } catch (error) {
        console.error('Profile error:', error);
        req.flash('error', 'Error loading profile');
        res.redirect('/home');
    }
};

exports.EmployeesRoute = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error', 'Please login to view employees');
            return res.redirect('/login');
        }
        res.render('employees', { 
            title: 'Employees',
            user: userService.formatUserResponse(user)
        });
    } catch (error) {
        console.error('Employees page error:', error);
        req.flash('error', 'Error loading employees page');
        res.redirect('/error');
    }
};

exports.errorPage = (req, res) => {
    const title = req.query.code === '404' ? '404 Not Found' : '500 Server Error';
    const message = req.flash('error')[0] || 'Something went wrong';
    res.render('error', { 
        title: title,
        message: message,
        user: req.session.user ? userService.formatUserResponse(req.session.user) : {}
    });
};
