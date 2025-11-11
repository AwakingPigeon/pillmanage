import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Medicine, MedicationRecord, ReminderSettings } from '../types';
import { StorageService } from '../services/storage';

interface AppContextType {
  state: AppState;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addMedicationRecord: (record: Omit<MedicationRecord, 'id' | 'createdAt'>) => void;
  updateMedicationRecord: (id: string, record: Partial<MedicationRecord>) => void;
  loadData: () => Promise<void>;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEDICINES'; payload: Medicine[] }
  | { type: 'SET_MEDICATION_RECORDS'; payload: MedicationRecord[] }
  | { type: 'SET_REMINDER_SETTINGS'; payload: ReminderSettings[] }
  | { type: 'ADD_MEDICINE'; payload: Medicine }
  | { type: 'UPDATE_MEDICINE'; payload: { id: string; medicine: Partial<Medicine> } }
  | { type: 'DELETE_MEDICINE'; payload: string }
  | { type: 'ADD_MEDICATION_RECORD'; payload: MedicationRecord };

const initialState: AppState = {
  medicines: [],
  medicationRecords: [],
  reminderSettings: [],
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MEDICINES':
      return { ...state, medicines: action.payload };
    case 'SET_MEDICATION_RECORDS':
      return { ...state, medicationRecords: action.payload };
    case 'SET_REMINDER_SETTINGS':
      return { ...state, reminderSettings: action.payload };
    case 'ADD_MEDICINE':
      return { ...state, medicines: [...state.medicines, action.payload] };
    case 'UPDATE_MEDICINE':
      return {
        ...state,
        medicines: state.medicines.map((med) =>
          med.id === action.payload.id
            ? { ...med, ...action.payload.medicine, updatedAt: new Date().toISOString() }
            : med
        ),
      };
    case 'DELETE_MEDICINE':
      return {
        ...state,
        medicines: state.medicines.filter((med) => med.id !== action.payload),
      };
    case 'ADD_MEDICATION_RECORD':
      return {
        ...state,
        medicationRecords: [...state.medicationRecords, action.payload],
      };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [medicines, medicationRecords, reminderSettings] = await Promise.all([
        StorageService.getMedicines(),
        StorageService.getMedicationRecords(),
        StorageService.getReminderSettings(),
      ]);

      dispatch({ type: 'SET_MEDICINES', payload: medicines });
      dispatch({ type: 'SET_MEDICATION_RECORDS', payload: medicationRecords });
      dispatch({ type: 'SET_REMINDER_SETTINGS', payload: reminderSettings });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addMedicine = async (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newMedicine: Medicine = {
        ...medicine,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_MEDICINE', payload: newMedicine });
      await StorageService.saveMedicines([...state.medicines, newMedicine]);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add medicine' });
    }
  };

  const updateMedicine = async (id: string, medicine: Partial<Medicine>) => {
    try {
      dispatch({ type: 'UPDATE_MEDICINE', payload: { id, medicine } });
      const updatedMedicines = state.medicines.map((med) =>
        med.id === id ? { ...med, ...medicine, updatedAt: new Date().toISOString() } : med
      );
      await StorageService.saveMedicines(updatedMedicines);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update medicine' });
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      dispatch({ type: 'DELETE_MEDICINE', payload: id });
      const updatedMedicines = state.medicines.filter((med) => med.id !== id);
      await StorageService.saveMedicines(updatedMedicines);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete medicine' });
    }
  };

  const addMedicationRecord = async (record: Omit<MedicationRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord: MedicationRecord = {
        ...record,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_MEDICATION_RECORD', payload: newRecord });
      await StorageService.saveMedicationRecords([...state.medicationRecords, newRecord]);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add medication record' });
    }
  };

  const updateMedicationRecord = async (id: string, record: Partial<MedicationRecord>) => {
    try {
      const updatedRecords = state.medicationRecords.map((rec) =>
        rec.id === id ? { ...rec, ...record } : rec
      );
      dispatch({ type: 'SET_MEDICATION_RECORDS', payload: updatedRecords });
      await StorageService.saveMedicationRecords(updatedRecords);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update medication record' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const value: AppContextType = {
    state,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addMedicationRecord,
    updateMedicationRecord,
    loadData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}