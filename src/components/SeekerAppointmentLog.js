// Tabs list (remove 'My Client')
const tabs = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'All', value: 'all' },
];

// Fetch only seeker appointments
useEffect(() => {
  async function fetchAppointments() {
    const response = await fetch(`/api/appointments?seekerId=${currentSeekerId}`);
    const data = await response.json();
    setAppointments(data);
  }
  fetchAppointments();
}, [currentSeekerId]);