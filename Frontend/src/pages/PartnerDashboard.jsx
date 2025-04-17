import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slice/authSlice";
import { Card, CardContent } from "@mui/material";
import { Button } from "@mui/material";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Wallet, FileText, LogOut } from "lucide-react";

const data = [
  { name: "Jan", earnings: 4000 },
  { name: "Feb", earnings: 3000 },
  { name: "Mar", earnings: 5000 },
  { name: "Apr", earnings: 7000 },
];

const PartnerDashboard = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    // Clear all auth-related items from localStorage
    localStorage.clear(); // This will remove token, userType, and any other auth-related items
    
    // Dispatch logout action
    dispatch(logout());
    
    // Force a clean navigation to login
    window.location.href = '/login';
    // Alternative approach using navigate if you prefer:
    // navigate('/login', { replace: true });
  };
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Partner Dashboard</h1>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<LogOut />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
      {/* Summary Cards */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Total Partners</h3>
            <p className="text-3xl font-bold">120</p>
          </div>
          <Users size={40} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Total Earnings</h3>
            <p className="text-3xl font-bold">$15,230</p>
          </div>
          <Wallet size={40} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Pending Approvals</h3>
            <p className="text-3xl font-bold">5</p>
          </div>
          <FileText size={40} />
        </CardContent>
      </Card>

      {/* Earnings Chart */}
      <div className="md:col-span-2 bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Earnings Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="earnings" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Partner List Table */}
      <div className="md:col-span-3 bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Partners</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell className="text-green-500">Verified</TableCell>
              <TableCell>
                <Button variant="outline">View</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell className="text-red-500">Pending</TableCell>
              <TableCell>
                <Button variant="outline">Approve</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PartnerDashboard;
