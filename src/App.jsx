import React from 'react';

// Context Providers
import GrantsProvider from './Context/GrantsContext';
import { UsGrantProvider } from './Context/UsGrantContext';
import { RegisterProvider } from './Context/RegisterGrantContext';
import NotificationProvider from './Context/NotificationContext';
import { ApplicationFormProvider } from './Context/ApplicationFormContext';

// Import AppRoutes
import AppRoutes from './Components/AppRoutes/AppRoutes';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <GrantsProvider>
      <NotificationProvider>
        <UsGrantProvider>
          <RegisterProvider>
            <ApplicationFormProvider>
              <AppRoutes />
              <ToastContainer />
            </ApplicationFormProvider>
          </RegisterProvider>
        </UsGrantProvider>
      </NotificationProvider>
    </GrantsProvider>
  );
}

export default App;