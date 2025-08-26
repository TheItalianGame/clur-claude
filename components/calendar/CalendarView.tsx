'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, differenceInMinutes, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, List, Users, X, Clock, CalendarDays, PanelLeftClose, PanelLeft } from 'lucide-react';
import { CalendarEvent } from '@/lib/types';
import CalendarFilters, { FilterState } from './CalendarFilters';
import Portal from '@/components/ui/Portal';

interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export default function CalendarView({ events = [], onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [hoveredEmployee, setHoveredEmployee] = useState<string | null>(null);
  const [hoveredDayPosition, setHoveredDayPosition] = useState<{ x: number, y: number } | null>(null);
  const [hoveredDayRef, setHoveredDayRef] = useState<HTMLDivElement | null>(null);
  const [popupTimeout, setPopupTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showWorkingHours, setShowWorkingHours] = useState(true);
  const [isDayViewCollapsed, setIsDayViewCollapsed] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState<FilterState | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Only fetch events if filters have been initialized
    if (calendarFilters !== null) {
      fetchEvents();
    }
  }, [currentDate, viewType, selectedEmployees, calendarFilters]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/records/employee');
      const data = await response.json();
      setEmployees(data);
      // Select all employees by default
      setSelectedEmployees(data.map((e: Employee) => e.id));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchEvents = async () => {
    const start = viewType === 'month' 
      ? startOfMonth(currentDate)
      : startOfWeek(currentDate);
    const end = viewType === 'month'
      ? endOfMonth(currentDate)
      : endOfWeek(currentDate);

    try {
      // Fetch events for each selected employee separately to get proper filtering
      let allEvents: CalendarEvent[] = [];
      
      if (selectedEmployees.length > 0) {
        // Fetch events for each selected employee
        for (const employeeId of selectedEmployees) {
          const response = await fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}&employeeId=${employeeId}`);
          const data = await response.json();
          allEvents = [...allEvents, ...data];
        }
        
        // Remove duplicates (events that appear for multiple employees)
        const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());
        
        // Apply filters
        const filteredEvents = uniqueEvents.filter(event => {
          // Check if the field for this event is selected
          const fieldKey = `${event.recordType}-${event.dateField}`;
          return calendarFilters?.fields[fieldKey] !== false;
        });
        
        setCalendarEvents(filteredEvents);
      } else {
        // If no employees selected, fetch all events
        const response = await fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
        const data = await response.json();
        
        // Apply filters
        const filteredEvents = data.filter((event: CalendarEvent) => {
          // Check if the field for this event is selected
          const fieldKey = `${event.recordType}-${event.dateField}`;
          return calendarFilters?.fields[fieldKey] !== false;
        });
        
        setCalendarEvents(filteredEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const navigatePrevious = () => {
    if (viewType === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewType === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewType === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewType === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const getDaysInView = () => {
    const start = viewType === 'month'
      ? startOfWeek(startOfMonth(currentDate))
      : startOfWeek(currentDate);
    const end = viewType === 'month'
      ? endOfWeek(endOfMonth(currentDate))
      : endOfWeek(currentDate);
    
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDayAndEmployee = (day: Date, employeeId?: string) => {
    return calendarEvents.filter(event => {
      if (!isSameDay(new Date(event.date), day)) return false;
      
      if (employeeId) {
        // Check if event belongs to this employee
        if (event.data.provider_id === employeeId) return true;
        if (event.data.organizer_id === employeeId) return true;
        if (event.data.employee_id === employeeId) return true;
        if (event.data.primary_provider_id === employeeId) return true;
        
        // Check if employee is in attendees list
        if (event.data.attendees) {
          try {
            const attendees = typeof event.data.attendees === 'string' 
              ? JSON.parse(event.data.attendees) 
              : event.data.attendees;
            if (Array.isArray(attendees) && attendees.includes(employeeId)) {
              return true;
            }
          } catch (e) {}
        }
        
        // Don't show non-employee events in employee-specific slots
        if (event.data.provider_id || event.data.organizer_id || event.data.employee_id || event.data.primary_provider_id) {
          return false;
        }
      }
      
      return true;
    });
  };

  const renderEvent = (event: CalendarEvent, day: Date, position?: { left: number, width: number, columns?: number, pixelOffset?: number }, hourHeight: number = 50, startHour: number = 0) => {
    const eventDate = new Date(event.date);
    const eventHour = eventDate.getHours();
    const eventMinutes = eventDate.getMinutes();
    
    // Calculate position based on the visible time range
    const hoursFromStart = eventHour - startHour;
    
    // If event is before start hour, don't show it
    if (hoursFromStart < 0) return null;
    
    const minutesFromStart = hoursFromStart * 60 + eventMinutes;
    const top = (minutesFromStart / 60) * hourHeight;
    
    // Check if event has end time or duration
    let hasTimeRange = false;
    let height = 12; // Thinner height for single point events
    
    if (event.data.end_time) {
      const endDate = new Date(event.data.end_time);
      const duration = differenceInMinutes(endDate, eventDate);
      if (duration > 0) {
        hasTimeRange = true;
        height = Math.max(16, (duration / 60) * hourHeight);
      }
    } else if (event.data.duration_minutes && event.data.duration_minutes > 0) {
      hasTimeRange = true;
      height = Math.max(16, (event.data.duration_minutes / 60) * hourHeight);
    }
    
    const pos = position || { left: 0, width: 100 };
    const hasOverlap = position?.pixelOffset !== undefined;
    // Pills for: events with time ranges
    const isPill = hasTimeRange;
    
    // Use fixed widths and pixel offsets for consistent sizing
    const eventWidth = isPill ? '8px' : '12px';
    const eventLeft = hasOverlap && position?.pixelOffset !== undefined 
      ? `${4 + position.pixelOffset}px` // Start at 4px, then add offset for each overlapping event
      : '4px'; // Single events start at 4px
    
    return (
      <div
        key={event.id}
        className="absolute cursor-pointer transition-all hover:z-10 hover:scale-110"
        style={{ 
          top: `${top + 2}px`,
          left: eventLeft,
          width: eventWidth,
          height: isPill ? `${height}px` : '12px',
          minHeight: isPill ? '12px' : '12px'
        }}
        onMouseEnter={(e) => {
          setHoveredEvent(event);
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePosition({ x: rect.left + rect.width / 2, y: rect.top });
        }}
        onMouseLeave={() => setHoveredEvent(null)}
        onClick={() => {
          // Navigate to the record when clicked
          window.location.href = `/records/${event.recordType}/${event.recordId || event.id}`;
        }}
        title={event.title}
      >
        {isPill ? (
          <div
            className="h-full rounded-full hover:opacity-90 shadow-sm"
            style={{ backgroundColor: event.color }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-3 h-3 rounded-full hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: event.color }}
            />
          </div>
        )}
      </div>
    );
  };

  const getOverlappingEvents = (events: CalendarEvent[]) => {
    // Sort events by start time, then by duration (longer events first)
    const sortedEvents = [...events].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      
      // If same start time, sort by duration (longer first)
      const durA = a.data.duration_minutes || 60;
      const durB = b.data.duration_minutes || 60;
      return durB - durA;
    });
    
    // Group overlapping events
    const groups: CalendarEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = new Date(event.date).getTime();
      let eventEnd = eventStart + 30 * 60 * 1000; // Default 30 minutes for better overlap detection
      
      if (event.data.end_time) {
        eventEnd = new Date(event.data.end_time).getTime();
      } else if (event.data.duration_minutes) {
        eventEnd = eventStart + event.data.duration_minutes * 60 * 1000;
      }
      
      // Find a group this event overlaps with
      let placed = false;
      for (const group of groups) {
        // Check if this event overlaps with any event in the group
        const overlaps = group.some(groupEvent => {
          const groupStart = new Date(groupEvent.date).getTime();
          let groupEnd = groupStart + 30 * 60 * 1000;
          
          if (groupEvent.data.end_time) {
            groupEnd = new Date(groupEvent.data.end_time).getTime();
          } else if (groupEvent.data.duration_minutes) {
            groupEnd = groupStart + groupEvent.data.duration_minutes * 60 * 1000;
          }
          
          // Events overlap if they start at the same time or their time ranges overlap
          return eventStart < groupEnd && eventEnd > groupStart;
        });
        
        if (overlaps) {
          group.push(event);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        groups.push([event]);
      }
    });
    
    // Find maximum number of overlapping events for column width calculation
    const maxColumns = Math.max(1, ...groups.map(g => g.length));
    
    // Assign positions within each group with fixed pixel offsets
    const eventPositions = new Map<string, { left: number, width: number, columns: number, pixelOffset: number }>();
    
    groups.forEach(group => {
      // Sort group by start time for consistent positioning
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const columns = group.length;
      group.forEach((event, index) => {
        // Use fixed pixel offsets instead of percentages
        const pixelOffset = index * 14; // 14px apart (8px width + 6px gap)
        
        eventPositions.set(event.id, {
          left: 0, // Not used when pixelOffset is set
          width: 8, // Fixed 8px width
          columns: maxColumns, // Store max columns for width calculation
          pixelOffset: pixelOffset
        });
      });
    });
    
    return eventPositions;
  };

  const renderWeeklyView = () => {
    const days = getDaysInView();
    const startHour = showWorkingHours ? 8 : 0;
    const endHour = showWorkingHours ? 18 : 24;
    const hoursToShow = endHour - startHour;
    const dayHeight = hoursToShow * 50; // 50px per hour for better spacing
    const hourHeight = 50; // Fixed height per hour
    
    // Calculate max overlapping events for any employee on the hovered day
    const getMaxOverlappingEvents = (dayIndex: number) => {
      if (dayIndex === null || selectedEmployees.length === 0) return 1;
      
      let maxOverlaps = 1;
      const day = days[dayIndex];
      
      selectedEmployees.forEach(empId => {
        const dayEvents = getEventsForDayAndEmployee(day, empId);
        const eventPositions = getOverlappingEvents(dayEvents);
        
        // Find the maximum columns needed for this employee
        eventPositions.forEach(pos => {
          if (pos.columns && pos.columns > maxOverlaps) {
            maxOverlaps = pos.columns;
          }
        });
      });
      
      return maxOverlaps;
    };
    
    // Determine columns based on hover state
    const getGridColumns = () => {
      if (hoveredDayIndex !== null && selectedEmployees.length > 0) {
        const columns = ['100px']; // Time column
        const maxOverlaps = getMaxOverlappingEvents(hoveredDayIndex);
        // More conservative width: base 100px plus 30px per overlapping column
        const minColumnWidth = maxOverlaps > 1 ? 100 + (30 * (maxOverlaps - 1)) : 100;
        
        days.forEach((_, index) => {
          if (index === hoveredDayIndex) {
            // Expanded day with employee columns - dynamically sized based on overlaps
            selectedEmployees.forEach(() => columns.push(`${minColumnWidth}px`));
          } else {
            // Collapsed days - standard width
            columns.push('minmax(120px, 1fr)');
          }
        });
        return columns.join(' ');
      }
      // All collapsed
      return `100px repeat(7, 1fr)`;
    };
    
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <div className="min-w-[800px] h-full flex flex-col">
            {/* Header with days - sticky positioning */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
              {/* Combined date header row - always reserve space with fixed height */}
              {selectedEmployees.length > 0 && (
                <div className="grid h-[52px]" style={{ gridTemplateColumns: getGridColumns() }}>
                  <div className="border-r dark:border-gray-700"></div>
                  {days.map((day, dayIndex) => {
                    const isHovered = hoveredDayIndex === dayIndex;
                    const showEmployeeColumns = isHovered && selectedEmployees.length > 0;
                    
                    if (showEmployeeColumns) {
                      // Combined date header spanning all employee columns
                      return (
                        <div 
                          key={`date-${dayIndex}`}
                          className="bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white text-center py-2 border-r dark:border-gray-700"
                          style={{ gridColumn: `span ${selectedEmployees.length}` }}
                          onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                          onMouseLeave={() => setHoveredDayIndex(null)}
                        >
                          <div className="text-sm font-bold">{format(day, 'EEE')}</div>
                          <div className="text-lg font-bold">{format(day, 'd')}</div>
                        </div>
                      );
                    } else {
                      return <div key={`date-${dayIndex}`} className="border-r dark:border-gray-700"></div>;
                    }
                  })}
                </div>
              )}
              
              {/* Employee/day headers row */}
              <div className="grid" style={{ gridTemplateColumns: getGridColumns() }}>
              <div className="border-r border-b dark:border-gray-700 p-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">Time</div>
              {days.map((day, dayIndex) => {
                const isHovered = hoveredDayIndex === dayIndex;
                const showEmployeeColumns = isHovered && selectedEmployees.length > 0;
                
                if (showEmployeeColumns) {
                  // Show employee columns for hovered day
                  return selectedEmployees.map((empId, empIndex) => {
                    const employee = employees.find(e => e.id === empId);
                    return (
                      <div 
                        key={`${dayIndex}-${empIndex}`} 
                        className="relative border-r border-b dark:border-gray-700 p-2 text-center bg-blue-50 dark:bg-blue-900/30"
                        onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                      >
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {employee?.first_name} {employee?.last_name?.charAt(0)}.
                        </div>
                      </div>
                    );
                  });
                } else {
                  // Show collapsed day column
                  return (
                    <div 
                      key={dayIndex} 
                      className={`border-r border-b dark:border-gray-700 p-2 text-center cursor-pointer transition-all duration-200 ${
                        isHovered ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    >
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{format(day, 'EEE')}</div>
                      <div className="text-lg text-gray-900 dark:text-gray-100">{format(day, 'd')}</div>
                      {selectedEmployees.length > 0 && (
                        <div className="text-xs text-gray-400">
                          {selectedEmployees.length} emp
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
          
          {/* Time slots and events - scrollable area */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid" style={{ gridTemplateColumns: getGridColumns() }}>
              {/* Time labels */}
              <div className="bg-gray-50 dark:bg-gray-900/50">
                {Array.from({ length: hoursToShow }, (_, i) => {
                  const hour = startHour + i;
                  return (
                    <div key={hour} className="border-r border-b dark:border-gray-700/50 p-2 text-xs text-gray-500 dark:text-gray-400" style={{ height: `${hourHeight}px` }}>
                      {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                    </div>
                  );
                })}
              </div>
              
              {/* Event cells */}
              {days.map((day, dayIndex) => {
                const isHovered = hoveredDayIndex === dayIndex;
                const showEmployeeColumns = isHovered && selectedEmployees.length > 0;
                
                if (showEmployeeColumns) {
                  // Show expanded employee columns for hovered day
                  return selectedEmployees.map((empId, empIndex) => {
                    const dayEvents = getEventsForDayAndEmployee(day, empId)
                      .filter(event => {
                        const eventHour = new Date(event.date).getHours();
                        return !showWorkingHours || (eventHour >= startHour && eventHour < endHour);
                      });
                    const eventPositions = getOverlappingEvents(dayEvents);
                    
                    return (
                      <div 
                        key={`${dayIndex}-${empIndex}`} 
                        className="relative bg-gradient-to-b from-blue-50/50 to-blue-50/20 dark:from-blue-900/20 dark:to-blue-900/10"
                        style={{ marginLeft: empIndex > 0 ? '2px' : '0', marginRight: '2px' }}
                        onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                      >
                        {/* Hour grid lines */}
                        {Array.from({ length: hoursToShow }, (_, i) => (
                          <div key={i} className="border-b dark:border-gray-700/20" style={{ height: `${hourHeight}px` }} />
                        ))}
                        
                        {/* Events */}
                        <div className="absolute inset-0">
                          {dayEvents.map(event => {
                            const adjustedEvent = showWorkingHours ? {
                              ...event,
                              date: new Date(event.date)
                            } : event;
                            const adjustedHourHeight = hourHeight;
                            const adjustedStartHour = startHour;
                            return renderEvent(adjustedEvent, day, eventPositions.get(event.id), adjustedHourHeight, adjustedStartHour);
                          })}
                        </div>
                      </div>
                    );
                  });
                } else {
                  // Show collapsed column with all employee events combined
                  const allDayEvents = selectedEmployees.length > 0 
                    ? selectedEmployees.flatMap(empId => getEventsForDayAndEmployee(day, empId))
                    : getEventsForDayAndEmployee(day);
                  
                  // Remove duplicates and filter by working hours
                  const uniqueEvents = Array.from(new Map(allDayEvents.map(e => [e.id, e])).values())
                    .filter(event => {
                      const eventHour = new Date(event.date).getHours();
                      return !showWorkingHours || (eventHour >= startHour && eventHour < endHour);
                    });
                  const eventPositions = getOverlappingEvents(uniqueEvents);
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`relative border-r dark:border-gray-700/30 cursor-pointer transition-all duration-200 ${
                        isHovered ? 'bg-gray-100/50 dark:bg-gray-800/30' : 'hover:bg-gray-50/30 dark:hover:bg-gray-800/20'
                      }`}
                      onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    >
                      {/* Hour grid lines */}
                      {Array.from({ length: hoursToShow }, (_, i) => (
                        <div key={i} className="border-b dark:border-gray-700/20" style={{ height: `${hourHeight}px` }} />
                      ))}
                      
                      {/* Events */}
                      <div className="absolute inset-0">
                        {uniqueEvents.map(event => renderEvent(event, day, eventPositions.get(event.id), hourHeight, startHour))}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const startHour = showWorkingHours ? 8 : 0;
    const endHour = showWorkingHours ? 18 : 24;
    const hoursToShow = endHour - startHour;
    const hourHeight = 60; // 60px per hour for day view
    
    const dayEvents = selectedEmployees.length > 0 
      ? selectedEmployees.map(empId => ({
          employee: employees.find(e => e.id === empId),
          events: getEventsForDayAndEmployee(currentDate, empId)
            .filter(event => {
              const eventHour = new Date(event.date).getHours();
              return !showWorkingHours || (eventHour >= startHour && eventHour < endHour);
            })
        }))
      : [];
    
    // Calculate max overlapping events for day view column sizing
    const getMaxOverlapsForDay = () => {
      let maxOverlaps = 1;
      
      selectedEmployees.forEach(empId => {
        const empEvents = getEventsForDayAndEmployee(currentDate, empId);
        const eventPositions = getOverlappingEvents(empEvents);
        
        eventPositions.forEach(pos => {
          if (pos.columns && pos.columns > maxOverlaps) {
            maxOverlaps = pos.columns;
          }
        });
      });
      
      return maxOverlaps;
    };
    
    const maxOverlaps = selectedEmployees.length > 0 ? getMaxOverlapsForDay() : 1;
    // More conservative width calculation for day view
    const minColumnWidth = maxOverlaps > 1 ? 120 + (30 * (maxOverlaps - 1)) : 120;
    const calendarWidth = isDayViewCollapsed ? 'w-16' : selectedEmployees.length > 0 ? `w-[${Math.min(1200, minColumnWidth * selectedEmployees.length)}px]` : 'w-full';
    
    return (
      <div className="flex h-full">
        {/* Calendar Section */}
        <div className={`${calendarWidth} transition-all duration-300 border-r dark:border-gray-700 overflow-hidden`}>
          <div className="border-b dark:border-gray-700">
            {!isDayViewCollapsed && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={navigatePrevious}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Previous day"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={navigateNext}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Next day"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsDayViewCollapsed(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Collapse calendar"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{format(currentDate, 'EEEE')}</h3>
                  <input
                    type="date"
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={(e) => setCurrentDate(new Date(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            {isDayViewCollapsed && (
              <div className="p-2">
                <button
                  onClick={() => setIsDayViewCollapsed(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mx-auto block"
                  title="Expand calendar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          {!isDayViewCollapsed && (
            <div className="overflow-auto h-[calc(100vh-300px)]">
              {/* Time grid with employee columns */}
              <div className="grid" style={{ gridTemplateColumns: `100px repeat(${Math.max(1, selectedEmployees.length)}, 1fr)` }}>
                {/* Time column */}
                <div className="sticky left-0 bg-gray-50 dark:bg-gray-900/50 z-10">
                  <div className="h-12 border-r border-b dark:border-gray-700 p-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Time</div>
                  {Array.from({ length: hoursToShow }, (_, i) => {
                    const hour = startHour + i;
                    return (
                      <div key={hour} className="h-[60px] border-r border-b dark:border-gray-700/50 p-2 text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                      </div>
                    );
                  })}
                </div>
                
                {/* Employee columns */}
                {selectedEmployees.length > 0 ? (
                  selectedEmployees.map(empId => {
                    const employee = employees.find(e => e.id === empId);
                    const empEvents = getEventsForDayAndEmployee(currentDate, empId)
                      .filter(event => {
                        const eventHour = new Date(event.date).getHours();
                        return !showWorkingHours || (eventHour >= startHour && eventHour < endHour);
                      });
                    const eventPositions = getOverlappingEvents(empEvents);
                    
                    return (
                      <div key={empId} className="relative" style={{ paddingLeft: '2px', paddingRight: '2px' }}>
                        {/* Employee header */}
                        <div className="h-12 border-b dark:border-gray-700 p-2 text-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
                          <div className="text-sm font-semibold truncate text-gray-700 dark:text-gray-300">
                            {employee?.first_name} {employee?.last_name}
                          </div>
                        </div>
                        
                        {/* Hour slots */}
                        <div className="relative bg-white dark:bg-gray-900/50">
                          {Array.from({ length: hoursToShow }, (_, i) => (
                            <div key={i} className="h-[60px] border-b dark:border-gray-700/30" />
                          ))}
                          
                          {/* Events */}
                          <div className="absolute inset-0">
                            {empEvents.map(event => renderEvent(event, currentDate, eventPositions.get(event.id), hourHeight, startHour))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">
                    Select employees to view their schedule
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Dashboard Section */}
        <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Dashboard</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Events</h4>
              <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">{calendarEvents.filter(e => isSameDay(new Date(e.date), currentDate)).length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Employees</h4>
              <p className="text-2xl font-bold mt-2">{selectedEmployees.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow col-span-2">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Upcoming Events</h4>
              <div className="space-y-2">
                {calendarEvents
                  .filter(e => isSameDay(new Date(e.date), currentDate))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer" onClick={() => onEventClick?.(event)}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-xs text-gray-500">{format(new Date(event.date), 'h:mm a')}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const days = getDaysInView();
    
    // Helper to handle mouse leave with delay
    const handleMouseLeave = () => {
      const timeout = setTimeout(() => {
        setHoveredDay(null);
        setHoveredDayRef(null);
      }, 150); // Small delay to allow moving to popup
      setPopupTimeout(timeout as any);
    };
    
    // Helper to cancel mouse leave  
    const cancelMouseLeave = () => {
      if (popupTimeout) {
        clearTimeout(popupTimeout);
        setPopupTimeout(null);
      }
    };
    
    return (
      <div className="grid grid-cols-7 gap-2 relative">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isHovered = hoveredDay && isSameDay(day, hoveredDay);
          
          // Get all events for this day
          const dayEvents = getEventsForDayAndEmployee(day);
          
          // Group events by record type for counting
          const eventsByType = dayEvents.reduce((acc, event) => {
            const typeId = event.recordType;
            if (!acc[typeId]) {
              acc[typeId] = {
                count: 0,
                color: event.color,
                displayName: event.recordTypeDisplay
              };
            }
            acc[typeId].count++;
            return acc;
          }, {} as Record<string, { count: number, color: string, displayName: string }>);
          
          // Prepare employee events if employees are selected
          const employeeEvents = selectedEmployees.length > 0 
            ? selectedEmployees.map(empId => {
                const employee = employees.find(e => e.id === empId);
                const empEvents = getEventsForDayAndEmployee(day, empId);
                return { employee, events: empEvents };
              }).filter(({ events }) => events.length > 0)
            : [];
          
          return (
            <div
              key={index}
              className={`relative border rounded-lg p-2 min-h-[120px] transition-all duration-200 ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } ${
                isToday ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-700'
              } ${
                isHovered ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg z-20' : ''
              } hover:shadow-md`}
              onMouseEnter={(e) => {
                if (dayEvents.length > 0) {
                  cancelMouseLeave();
                  setHoveredDay(day);
                  setHoveredDayRef(e.currentTarget as HTMLDivElement);
                }
              }}
              onMouseLeave={handleMouseLeave}
            >
              {/* Day number */}
              <div className={`text-sm font-semibold mb-1 ${
                !isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {format(day, 'd')}
              </div>
              
              {/* Always show counts */}
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(eventsByType).map(([typeId, { count, color, displayName }]) => (
                  <div
                    key={typeId}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-110 transition-transform shadow-sm"
                    style={{ 
                      backgroundColor: color,
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/records/${typeId}`;
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      // Keep day hovered when hovering badge
                      cancelMouseLeave();
                    }}
                    title={`${displayName}: ${count} ${count === 1 ? 'event' : 'events'}`}
                  >
                    {count}
                  </div>
                ))}
              </div>
              
              {/* Expanded view on hover */}
              {isHovered && dayEvents.length > 0 && (
                <Portal>
                  <div
                    className="calendar-day-popup fixed z-[10000] border-2 border-blue-400 dark:border-blue-500 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-2xl pointer-events-auto min-w-[280px] max-w-[400px]"
                    style={{
                      top: (() => {
                        if (!hoveredDayRef) return '0px';
                        const rect = hoveredDayRef.getBoundingClientRect();
                        
                        // Calculate content height based on what will be shown
                        let estimatedHeight = 80; // Base height for header and padding
                        if (selectedEmployees.length > 0 && employeeEvents.length > 0) {
                          // Employee view - each employee row is ~60px
                          estimatedHeight += Math.min(employeeEvents.length, 8) * 60;
                          if (employeeEvents.length > 8) estimatedHeight += 40; // "more" text
                        } else {
                          // Type view - each type section is ~80px
                          estimatedHeight += Object.keys(eventsByType).length * 80;
                        }
                        estimatedHeight = Math.min(estimatedHeight, 500); // Max height
                        
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        
                        // Check if we're in the bottom rows
                        const rowIndex = Math.floor(index / 7);
                        const totalRows = Math.ceil(days.length / 7);
                        const isBottomRows = rowIndex >= totalRows - 2; // Last 2 rows
                        
                        if (isBottomRows && spaceAbove > estimatedHeight + 10) {
                          // For bottom rows, position above
                          return `${rect.top - estimatedHeight - 4}px`;
                        } else if (spaceBelow > estimatedHeight + 10) {
                          // Position below for top/middle rows
                          return `${rect.bottom + 4}px`;
                        } else if (spaceAbove > estimatedHeight + 10) {
                          // Fallback to above if no space below
                          return `${rect.top - estimatedHeight - 4}px`;
                        } else {
                          // Center in available space if tight
                          const availableHeight = window.innerHeight - 20;
                          return `${Math.max(10, (availableHeight - estimatedHeight) / 2)}px`;
                        }
                      })(),
                      left: (() => {
                        if (!hoveredDayRef) return '0px';
                        const rect = hoveredDayRef.getBoundingClientRect();
                        const popupWidth = 320;
                        const dayOfWeek = index % 7;
                        
                        // Calculate position to keep popup close to cell
                        let idealLeft;
                        
                        if (dayOfWeek === 0) {
                          // Sunday - align left edge with cell
                          idealLeft = rect.left;
                        } else if (dayOfWeek === 6) {
                          // Saturday - align right edge with cell
                          idealLeft = rect.right - popupWidth;
                        } else if (dayOfWeek <= 2) {
                          // Mon-Tue - slight offset from left
                          idealLeft = rect.left - 20;
                        } else if (dayOfWeek >= 4) {
                          // Thu-Fri - slight offset from right
                          idealLeft = rect.right - popupWidth + 20;
                        } else {
                          // Wed - center over cell
                          idealLeft = rect.left + (rect.width / 2) - (popupWidth / 2);
                        }
                        
                        // Keep within viewport bounds
                        const minLeft = 10;
                        const maxLeft = window.innerWidth - popupWidth - 10;
                        return `${Math.max(minLeft, Math.min(idealLeft, maxLeft))}px`;
                      })(),
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                    onMouseEnter={() => {
                      cancelMouseLeave();
                      setHoveredDay(day);
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-bold text-base text-gray-800 dark:text-gray-100">
                        {format(day, 'EEEE, MMMM d')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {selectedEmployees.length > 0 && employeeEvents.length > 0 ? (
                        <>
                          {/* Employee view */}
                          {employeeEvents.slice(0, 8).map(({ employee, events }) => (
                            <div key={employee?.id} className="flex items-start gap-3 py-1">
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                  {employee?.first_name?.charAt(0)}{employee?.last_name?.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {employee?.first_name} {employee?.last_name}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {events.slice(0, 8).map((event) => (
                                    <div
                                      key={event.id}
                                      className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity group"
                                      style={{ 
                                        backgroundColor: `${event.color}20`,
                                        color: event.color,
                                        border: `1px solid ${event.color}`
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `/records/${event.recordType}/${event.recordId}`;
                                      }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        setHoveredEvent(event);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setMousePosition({ x: rect.left + rect.width / 2, y: rect.top });
                                      }}
                                      onMouseLeave={(e) => {
                                        e.stopPropagation();
                                        setHoveredEvent(null);
                                      }}
                                    >
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                                      {format(new Date(event.date), 'h:mma')}
                                    </div>
                                  ))}
                                  {events.length > 8 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                                      +{events.length - 8}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {employeeEvents.length > 8 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                              +{employeeEvents.length - 8} more employees with events
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Type-grouped view */}
                          {Object.entries(eventsByType).map(([typeId, { count, color, displayName }]) => {
                            const typeEvents = dayEvents.filter(e => e.recordType === typeId);
                            return (
                              <div key={typeId} className="border-l-4 pl-3 py-2" style={{ borderColor: color }}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                    {displayName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {count} {count === 1 ? 'event' : 'events'}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {typeEvents.slice(0, 3).map((event) => (
                                    <div
                                      key={event.id}
                                      className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                                      onClick={() => window.location.href = `/records/${event.recordType}/${event.recordId}`}
                                    >
                                      • {format(new Date(event.date), 'h:mm a')} - {event.title}
                                    </div>
                                  ))}
                                  {typeEvents.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      +{typeEvents.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </Portal>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const days = getDaysInView();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-4">
          {viewType !== 'day' && (
            <>
              <h2 className="text-2xl font-bold dark:text-gray-100">
                {format(currentDate, viewType === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={navigatePrevious}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
          {viewType === 'day' && (
            <h2 className="text-2xl font-bold dark:text-gray-100">Day View</h2>
          )}
        </div>
        
        <div className="flex gap-2">
          <CalendarFilters onFiltersChange={setCalendarFilters} />
          
          {(viewType === 'week' || viewType === 'day') && (
            <button
              onClick={() => setShowWorkingHours(!showWorkingHours)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showWorkingHours 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              {showWorkingHours ? '8am-6pm' : 'All Hours'}
            </button>
          )}
          
          <button
            onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors relative"
          >
            <Users className="w-4 h-4" />
            Employees ({selectedEmployees.length})
            
            {/* Employee selector dropdown */}
            {showEmployeeSelector && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Select Employees</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmployeeSelector(false);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {employees.map(employee => (
                    <label
                      key={employee.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {employee.first_name} {employee.last_name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="p-2 border-t flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployees(employees.map(e => e.id));
                    }}
                    className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Select All
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployees([]);
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </button>
          
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewType === 'month' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Month
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewType === 'week' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100'
            }`}
          >
            <List className="w-4 h-4" />
            Week
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewType === 'day' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Day
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewType === 'month' && (
          <div className="p-4 relative" style={{ zIndex: 1 }}>
            {/* Day headers for monthly view */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {day}
                </div>
              ))}
            </div>
            <div className="relative" style={{ zIndex: 10 }}>
              {renderMonthlyView()}
            </div>
          </div>
        )}
        
        {viewType === 'week' && (
          <div className="p-4">
            {renderWeeklyView()}
          </div>
        )}
        
        {viewType === 'day' && renderDayView()}
      </div>

      {/* Legend */}
      <div className="border-t p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Legend:</span>
          {Array.from(new Set(calendarEvents.map(e => e.recordType))).map(type => {
            const event = calendarEvents.find(e => e.recordType === type);
            if (!event) return null;
            return (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{event.recordTypeDisplay}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global tooltip */}
      {hoveredEvent && (
        <Portal>
          <div 
            className="fixed z-[20000] p-3 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[250px] max-w-[350px] pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y - 10}px`,
              transform: 'translate(-50%, -100%)',
              animation: 'fadeIn 0.1s ease-out'
            }}
          >
            {/* Header with type badge */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: hoveredEvent.color }}
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{hoveredEvent.recordTypeDisplay}</span>
              </div>
              {hoveredEvent.data.status && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                  {hoveredEvent.data.status}
                </span>
              )}
            </div>
            
            {/* Title */}
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">{hoveredEvent.title}</div>
            
            {/* Available Fields Indicators */}
            <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              {hoveredEvent.data.patient_name && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Patient
                </span>
              )}
              {(hoveredEvent.data.provider_name || hoveredEvent.data.employee_name) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Provider
                </span>
              )}
              {hoveredEvent.data.location && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Location
                </span>
              )}
              {hoveredEvent.data.duration_minutes && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Duration
                </span>
              )}
              {hoveredEvent.data.description && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                  Description
                </span>
              )}
              {hoveredEvent.data.notes && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                  Notes
                </span>
              )}
              {hoveredEvent.data.reason && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Reason
                </span>
              )}
              {hoveredEvent.data.type && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  Type
                </span>
              )}
            </div>
            
            {/* Time information */}
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(hoveredEvent.date), 'MMM d, yyyy h:mm a')}</span>
                {hoveredEvent.data.end_time && (
                  <span> - {format(new Date(hoveredEvent.data.end_time), 'h:mm a')}</span>
                )}
              </div>
              
              {/* Duration */}
              {hoveredEvent.data.duration_minutes && (
                <div className="flex items-center gap-1">
                  <span className="ml-4">Duration: {hoveredEvent.data.duration_minutes} minutes</span>
                </div>
              )}
              
              {/* Location */}
              {hoveredEvent.data.location && (
                <div className="flex items-start gap-1 mt-2">
                  <span className="font-medium">Location:</span>
                  <span>{hoveredEvent.data.location}</span>
                </div>
              )}
              
              {/* Provider/Employee */}
              {(hoveredEvent.data.provider_name || hoveredEvent.data.employee_name) && (
                <div className="flex items-start gap-1 mt-2">
                  <Users className="w-3 h-3 mt-0.5" />
                  <span>{hoveredEvent.data.provider_name || hoveredEvent.data.employee_name}</span>
                </div>
              )}
              
              {/* Patient */}
              {hoveredEvent.data.patient_name && (
                <div className="flex items-start gap-1">
                  <span className="font-medium">Patient:</span>
                  <span>{hoveredEvent.data.patient_name}</span>
                </div>
              )}
              
              {/* Reason */}
              {hoveredEvent.data.reason && (
                <div className="flex items-start gap-1">
                  <span className="font-medium">Reason:</span>
                  <span>{hoveredEvent.data.reason}</span>
                </div>
              )}
              
              {/* Type */}
              {hoveredEvent.data.type && (
                <div className="flex items-start gap-1">
                  <span className="font-medium">Type:</span>
                  <span>{hoveredEvent.data.type}</span>
                </div>
              )}
              
              {/* Description */}
              {hoveredEvent.data.description && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                    {hoveredEvent.data.description}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {hoveredEvent.data.notes && (
                <div className="mt-2">
                  <span className="font-medium">Notes:</span>
                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                    {hoveredEvent.data.notes}
                  </div>
                </div>
              )}
              
              {/* Click hint */}
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                Click to view full record
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}