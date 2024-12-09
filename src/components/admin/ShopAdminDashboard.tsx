import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { ShopManager } from './ShopManager';
import { useItems } from '../../hooks/useItems';
import { ShoppingBag, TrendingUp, Package, Star } from 'lucide-react';

export function ShopAdminDashboard() {
  const { isLoading } = useItems();

  const stats = [
    {
      title: 'Total Items',
      value: '24',
      icon: <Package className="text-blue-500" />,
      change: '+12%',
    },
    {
      title: 'Featured Items',
      value: '4',
      icon: <Star className="text-yellow-500" />,
      change: '+2',
    },
    {
      title: 'Sales Today',
      value: '156',
      icon: <ShoppingBag className="text-green-500" />,
      change: '+23%',
    },
    {
      title: 'Revenue',
      value: '12.4k',
      icon: <TrendingUp className="text-purple-500" />,
      change: '+18%',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Shop Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
                {stat.icon}
              </Box>
              <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                {stat.title}
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {stat.value}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  color: stat.change.startsWith('+') ? 'success.main' : 'error.main',
                }}
              >
                {stat.change} from last month
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <ShopManager />
    </Box>
  );
} 