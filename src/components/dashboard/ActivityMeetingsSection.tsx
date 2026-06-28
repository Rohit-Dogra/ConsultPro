import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Activity {
  type: string;
  client: string;
  time: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'audio' | 'video' | 'chat';
  clientName: string;
}

interface ActivityMeetingsSectionProps {
  recentActivity: Activity[];
  meetings: Meeting[];
}

const ActivityMeetingsSection: React.FC<ActivityMeetingsSectionProps> = ({ recentActivity, meetings }) => {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Activity & Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Recent Activity Section */}
          <div>
            <h3 className="font-medium mb-3">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-muted-foreground">{activity.client}</p>
                    </div>
                    <span className="text-muted-foreground">{activity.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center">No recent activity</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Upcoming Meetings Section */}
          <div>
            <h3 className="font-medium mb-3">Upcoming Meetings</h3>
            <div className="space-y-4">
              {meetings && meetings.length > 0 ? (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{meeting.title}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>{format(new Date(meeting.date), 'PPP')} at {meeting.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">with {meeting.clientName}</p>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                        {meeting.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center">No upcoming meetings</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityMeetingsSection;