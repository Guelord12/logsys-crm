import { create } from 'zustand';
import { companyService } from '@services/company.service';

export const useCompanyStore = create((set, get) => ({
  companies: [],
  currentCompany: null,
  isLoading: false,
  pagination: null,

  fetchCompanies: async (params = {}) => {
    set({ isLoading: true });
    
    try {
      const response = await companyService.getCompanies(params);
      
      set({
        companies: response.data.data.companies,
        pagination: response.data.data.pagination,
        isLoading: false
      });
      
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCompany: async (id) => {
    set({ isLoading: true });
    
    try {
      const response = await companyService.getCompanyById(id);
      
      set({
        currentCompany: response.data.data,
        isLoading: false
      });
      
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCompany: async (data) => {
    try {
      const response = await companyService.createCompany(data);
      
      set(state => ({
        companies: [response.data.data, ...state.companies]
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCompany: async (id, data) => {
    try {
      const response = await companyService.updateCompany(id, data);
      
      set(state => ({
        companies: state.companies.map(c => c.id === id ? response.data.data : c),
        currentCompany: state.currentCompany?.id === id ? response.data.data : state.currentCompany
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCompany: async (id) => {
    try {
      await companyService.deleteCompany(id);
      
      set(state => ({
        companies: state.companies.filter(c => c.id !== id),
        currentCompany: state.currentCompany?.id === id ? null : state.currentCompany
      }));
    } catch (error) {
      throw error;
    }
  },

  updateSubscription: async (companyId, data) => {
    try {
      const response = await companyService.updateSubscription(companyId, data);
      
      set(state => ({
        companies: state.companies.map(c => 
          c.id === companyId 
            ? { ...c, activeSubscription: response.data.data }
            : c
        )
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  clearCurrentCompany: () => {
    set({ currentCompany: null });
  }
}));