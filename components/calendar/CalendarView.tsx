'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, differenceInMinutes, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, List, Users, X, Clock, CalendarDays, PanelLeftClose, PanelLeft } from 'lucide-react';
import { CalendarEvent } from '@/lib/types';

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
  const [showWorkingHours, setShowWorkingHours] = useState(true);
  const [isDayViewCollapsed, setIsDayViewCollapsed] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewType, selectedEmployees]);

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
        setCalendarEvents(uniqueEvents);
      } else {
        // If no employees selected, fetch all events
        const response = await fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
        const data = await response.json();
        setCalendarEvents(data);
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

  const renderEvent = (event: CalendarEvent, day: Date, position?: { left: number, width: number }, hourHeight: number = 25, startHour: number = 0) => {
    const eventDate = new Date(event.date);
    const dayStart = startOfDay(day);
    const minutesFromStart = differenceInMinutes(eventDate, dayStart) - (startHour * 60);
    const top = (minutesFromStart / 60) * hourHeight;
    
    // Check if event has end time (for meetings/appointments)
    let height = hourHeight; // Default 1 hour
    if (event.data.end_time) {
      const endDate = new Date(event.data.end_time);
      const duration = differenceInMinutes(endDate, eventDate);
      height = (duration / 60) * hourHeight;
    } else if (event.data.duration_minutes) {
      height = (event.data.duration_minutes / 60) * hourHeight;
    }
    
    const isSpanEvent = event.data.end_time || event.data.duration_minutes;
    const pos = position || { left: 0, width: 100 };
    
    return (
      <div
        key={event.id}
        className="absolute cursor-pointer transition-all hover:z-10"
        style={{ 
          top: `${top}px`,
          left: `${pos.left}%`,
          width: `${pos.width}%`,
          height: isSpanEvent ? `${height}px` : '20px',
          minHeight: '20px',
          paddingLeft: '2px',
          paddingRight: '2px'
        }}
        onMouseEnter={(e) => {
          setHoveredEvent(event);
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePosition({ x: rect.left + rect.width / 2, y: rect.top });
        }}
        onMouseLeave={() => setHoveredEvent(null)}
        onClick={() => onEventClick?.(event)}
      >
        {isSpanEvent ? (
          <div
            className="h-full rounded px-1 py-1 text-xs text-white overflow-hidden hover:opacity-90"
            style={{ backgroundColor: event.color }}
          >
            <div className="font-semibold truncate">{event.title}</div>
            {height > 40 && pos.width > 50 && (
              <div className="text-xs opacity-90">
                {format(eventDate, 'h:mm a')}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full hover:scale-125 transition-transform flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />
            {pos.width > 30 && (
              <span className="text-xs truncate">{event.title}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const getOverlappingEvents = (events: CalendarEvent[]) => {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group overlapping events
    const groups: CalendarEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = new Date(event.date).getTime();
      let eventEnd = eventStart + 60 * 60 * 1000; // Default 1 hour
      
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
          let groupEnd = groupStart + 60 * 60 * 1000;
          
          if (groupEvent.data.end_time) {
            groupEnd = new Date(groupEvent.data.end_time).getTime();
          } else if (groupEvent.data.duration_minutes) {
            groupEnd = groupStart + groupEvent.data.duration_minutes * 60 * 1000;
          }
          
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
    
    // Assign positions within each group
    const eventPositions = new Map<string, { left: number, width: number }>();
    
    groups.forEach(group => {
      const columns = group.length;
      group.forEach((event, index) => {
        eventPositions.set(event.id, {
          left: (index / columns) * 100,
          width: 100 / columns
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
    const dayHeight = 600; // Height for the day column in pixels
    const hourHeight = dayHeight / hoursToShow; // Height per hour
    
    // Determine columns based on hover state
    const getGridColumns = () => {
      if (hoveredDayIndex !== null && selectedEmployees.length > 0) {
        const columns = ['100px']; // Time column
        const employeeCount = selectedEmployees.length;
        
        days.forEach((_, index) => {
          if (index === hoveredDayIndex) {
            // Expanded day with employee columns - make it wider
            selectedEmployees.forEach(() => columns.push(`${200 / employeeCount}px`));
          } else {
            // Collapsed days - make them narrower
            columns.push('minmax(80px, 1fr)');
          }
        });
        return columns.join(' ');
      }
      // All collapsed
      return `100px repeat(7, 1fr)`;
    };
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with days */}
          <div className="grid sticky top-0 z-10 bg-white dark:bg-gray-900" style={{ gridTemplateColumns: getGridColumns() }}>
            <div className="border-r border-b dark:border-gray-700 p-2 text-sm font-semibold">Time</div>
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
                      className="relative border-r border-b dark:border-gray-700 p-2 text-center bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg"
                      onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    >
                      <div className="absolute inset-0 bg-white/10 dark:bg-white/5"></div>
                      <div className="relative">
                        <div className="text-sm font-bold">{format(day, 'EEE')}</div>
                        <div className="text-lg font-bold">{format(day, 'd')}</div>
                        <div className="text-xs opacity-90 truncate">
                          {employee?.first_name} {employee?.last_name?.charAt(0)}.
                        </div>
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
                      isHovered ? 'bg-gray-100 dark:bg-gray-800 scale-105' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                    onMouseLeave={() => setHoveredDayIndex(null)}
                  >
                    <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
                    <div className="text-lg">{format(day, 'd')}</div>
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
          
          {/* Time slots and events */}
          <div className="relative">
            <div className="grid" style={{ gridTemplateColumns: getGridColumns() }}>
              {/* Time labels */}
              <div className="bg-gray-50 dark:bg-gray-900/50">
                {Array.from({ length: hoursToShow }, (_, i) => {
                  const hour = startHour + i;
                  return (
                    <div key={hour} className="border-r border-b dark:border-gray-700/50 h-12 p-2 text-xs text-gray-500 dark:text-gray-400">
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
                        className="relative border-r dark:border-gray-700/30 bg-gradient-to-b from-blue-50/50 to-blue-50/20 dark:from-blue-900/20 dark:to-blue-900/10"
                        onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                      >
                        {/* Hour grid lines */}
                        {Array.from({ length: hoursToShow }, (_, i) => (
                          <div key={i} className="border-b dark:border-gray-700/20 h-12" />
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
                        <div key={i} className="border-b dark:border-gray-700/20 h-12" />
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
    );
  };

  const renderDayView = () => {
    const startHour = showWorkingHours ? 8 : 0;
    const endHour = showWorkingHours ? 18 : 24;
    const hoursToShow = endHour - startHour;
    const hourHeight = 60; // Larger height for day view
    
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
    
    const calendarWidth = isDayViewCollapsed ? 'w-16' : selectedEmployees.length > 0 ? `w-[${Math.min(800, 200 * selectedEmployees.length)}px]` : 'w-full';
    
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
                  <h3 className="text-xl font-bold">{format(currentDate, 'EEEE')}</h3>
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
                  <div className="h-12 border-r border-b dark:border-gray-700 p-2 text-sm font-semibold">Time</div>
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
                      <div key={empId} className="relative">
                        {/* Employee header */}
                        <div className="h-12 border-r border-b dark:border-gray-700 p-2 text-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                          <div className="text-sm font-semibold truncate">
                            {employee?.first_name} {employee?.last_name}
                          </div>
                        </div>
                        
                        {/* Hour slots */}
                        <div className="relative">
                          {Array.from({ length: hoursToShow }, (_, i) => (
                            <div key={i} className="h-[60px] border-r border-b dark:border-gray-700/30" />
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
                  <div className="col-span-full p-8 text-center text-gray-500">
                    Select employees to view their schedule
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Dashboard Section */}
        <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-xl font-semibold mb-4">Dashboard</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Events</h4>
              <p className="text-2xl font-bold mt-2">{calendarEvents.filter(e => isSameDay(new Date(e.date), currentDate)).length}</p>
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
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-2 min-h-[120px] ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } ${
                isToday ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-700'
              } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              <div className={`text-sm font-semibold mb-1 ${
                !isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {format(day, 'd')}
              </div>
              
              {/* Events grouped by employee */}
              <div className="space-y-1">
                {selectedEmployees.length > 0 ? (
                  selectedEmployees.map(empId => {
                    const employee = employees.find(e => e.id === empId);
                    const empEvents = getEventsForDayAndEmployee(day, empId);
                    
                    if (empEvents.length === 0) return null;
                    
                    return (
                      <div key={empId} className="flex items-center gap-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate w-12" title={`${employee?.first_name} ${employee?.last_name}`}>
                          {employee?.first_name?.charAt(0)}{employee?.last_name?.charAt(0)}:
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {empEvents.map(event => (
                            <div
                              key={event.id}
                              className="w-2 h-2 rounded-full cursor-pointer hover:scale-125 transition-transform"
                              style={{ backgroundColor: event.color }}
                              onMouseEnter={(e) => {
                                setHoveredEvent(event);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMousePosition({ x: rect.left + rect.width / 2, y: rect.top });
                              }}
                              onMouseLeave={() => setHoveredEvent(null)}
                              onClick={() => onEventClick?.(event)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Show all events when no employees selected
                  <div className="flex gap-1 flex-wrap">
                    {getEventsForDayAndEmployee(day).map(event => (
                      <div
                        key={event.id}
                        className="w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform"
                        style={{ backgroundColor: event.color }}
                        onMouseEnter={(e) => {
                          setHoveredEvent(event);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePosition({ x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredEvent(null)}
                        onClick={() => onEventClick?.(event)}
                      />
                    ))}
                  </div>
                )}
              </div>
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
              viewType === 'month' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Month
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewType === 'week' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            Week
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewType === 'day' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
          <div className="p-4">
            {/* Day headers for monthly view */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            {renderMonthlyView()}
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
          <span className="text-sm font-semibold text-gray-600">Legend:</span>
          {Array.from(new Set(calendarEvents.map(e => e.recordType))).map(type => {
            const event = calendarEvents.find(e => e.recordType === type);
            if (!event) return null;
            return (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <span className="text-sm text-gray-600">{event.recordTypeDisplay}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global tooltip */}
      {hoveredEvent && (
        <div 
          className="fixed z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] pointer-events-none"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y - 10}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: hoveredEvent.color }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{hoveredEvent.recordTypeDisplay}</span>
          </div>
          <div className="font-semibold text-sm dark:text-gray-100">{hoveredEvent.title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {format(new Date(hoveredEvent.date), 'MMM d, yyyy h:mm a')}
            {hoveredEvent.data.end_time && ` - ${format(new Date(hoveredEvent.data.end_time), 'h:mm a')}`}
          </div>
          {hoveredEvent.data.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {hoveredEvent.data.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}