import React from 'react';
import Layout from '@/components/Layout';
import JobApplicationsAdmin from '@/components/careers/JobApplicationsAdmin';

const CareersAdmin: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <JobApplicationsAdmin />
      </div>
    </Layout>
  );
};

export default CareersAdmin;