import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ToasterType = 'success' | 'error' | 'delete';

interface CustomToasterContextType {
  isVisible: boolean;
  message: string;
  type: ToasterType;
  showToaster: (message: string, type?: ToasterType) => void;
  hideToaster: () => void;
}

const CustomToasterContext = createContext<CustomToasterContextType | undefined>(undefined);

export const CustomToasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToasterType>('success');

  const showToaster = useCallback((msg: string, toasterType: ToasterType = 'success') => {
    setMessage(msg);
    setType(toasterType);
    setIsVisible(true);
    // Note: We'll let the component handle the auto-hide timer since it needs to sync with the loader animation
  }, []);

  const hideToaster = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <CustomToasterContext.Provider value={{ isVisible, message, type, showToaster, hideToaster }}>
      {children}
    </CustomToasterContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomToaster = () => {
  const context = useContext(CustomToasterContext);
  if (!context) {
    throw new Error('useCustomToaster must be used within a CustomToasterProvider');
  }
  return context;
};
