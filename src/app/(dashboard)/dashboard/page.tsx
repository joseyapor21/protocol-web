'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/visitors/stat-card';
import { WeekGroup } from '@/components/visitors/week-group';
import { Visitor, WeekGroup as WeekGroupType } from '@/types';
import { groupVisitorsByWeek, getThisWeekVisitors, getTodayVisitors } from '@/lib/utils';
import { Users, Calendar, CalendarCheck, Plus, RefreshCw, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [weekGroups, setWeekGroups] = useState<WeekGroupType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVisitors = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/visitors?${params}`);
      const data = await response.json();

      if (data.status === 'success') {
        setVisitors(data.data);
        setWeekGroups(groupVisitorsByWeek(data.data));
      } else {
        toast.error('Failed to fetch visitors');
      }
    } catch {
      toast.error('Error loading visitors');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisitors();
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/visitors/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Visitor deleted successfully');
        fetchVisitors();
      } else {
        toast.error(data.message || 'Failed to delete visitor');
      }
    } catch {
      toast.error('Error deleting visitor');
    }
  };

  const thisWeekCount = getThisWeekVisitors(visitors).length;
  const todayCount = getTodayVisitors(visitors).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Visitor Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVisitors(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/visitors/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Visitor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Visitors" value={visitors.length} icon={Users} color="blue" />
        <StatCard title="This Week" value={thisWeekCount} icon={Calendar} color="green" />
        <StatCard title="Arriving Today" value={todayCount} icon={CalendarCheck} color="orange" />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, phone, hotel, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </div>
      </form>

      {/* Visitors by Week */}
      {weekGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visitors found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first visitor</p>
          <Link href="/visitors/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Visitor
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {weekGroups.map((weekGroup, index) => (
            <WeekGroup
              key={weekGroup.weekStart.toISOString()}
              weekGroup={weekGroup}
              defaultExpanded={index === 0}
              onDeleteVisitor={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
