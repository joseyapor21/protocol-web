'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { VisitorCard } from './visitor-card';
import { WeekGroup as WeekGroupType, Visitor } from '@/types';
import { formatWeekRange } from '@/lib/utils';

interface WeekGroupProps {
  weekGroup: WeekGroupType;
  defaultExpanded?: boolean;
  onDeleteVisitor?: (id: string) => void;
}

interface GroupedVisitors {
  groupId: string | null;
  visitors: Visitor[];
  isGroup: boolean;
}

export function WeekGroup({ weekGroup, defaultExpanded = true, onDeleteVisitor }: WeekGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Group visitors by groupId
  const groupedVisitors = useMemo(() => {
    const groups = new Map<string | null, Visitor[]>();

    weekGroup.visitors.forEach((visitor) => {
      const key = visitor.groupId || null;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(visitor);
    });

    // Convert to array and sort (grouped visitors first, then by leader status)
    const result: GroupedVisitors[] = [];

    groups.forEach((visitors, groupId) => {
      if (groupId) {
        // Sort group members: leader first
        visitors.sort((a, b) => {
          if (a.isGroupLeader && !b.isGroupLeader) return -1;
          if (!a.isGroupLeader && b.isGroupLeader) return 1;
          return 0;
        });
      }
      result.push({
        groupId,
        visitors,
        isGroup: groupId !== null && visitors.length > 1,
      });
    });

    return result;
  }, [weekGroup.visitors]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <span className="font-semibold text-gray-900">
            {formatWeekRange(weekGroup.weekStart, weekGroup.weekEnd)}
          </span>
        </div>
        <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
          {weekGroup.visitors.length} visitor{weekGroup.visitors.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {groupedVisitors.map((group) => (
            group.isGroup ? (
              // Render grouped visitors in a container
              <div
                key={group.groupId}
                className="border-l-4 border-purple-400 bg-purple-50 rounded-r-lg p-3 space-y-2"
              >
                <div className="flex items-center gap-2 text-sm text-purple-700 font-medium mb-2">
                  <Users className="h-4 w-4" />
                  Group ({group.visitors.length} travelers)
                </div>
                {group.visitors.map((visitor) => (
                  <VisitorCard
                    key={visitor._id?.toString()}
                    visitor={visitor}
                    onDelete={onDeleteVisitor}
                  />
                ))}
              </div>
            ) : (
              // Render individual visitors
              group.visitors.map((visitor) => (
                <VisitorCard
                  key={visitor._id?.toString()}
                  visitor={visitor}
                  onDelete={onDeleteVisitor}
                />
              ))
            )
          ))}
        </div>
      )}
    </div>
  );
}
