// Character data fetching helper
import { queryClient } from './queryClient';

// Prefetch character data to ensure it's available in the UI
export async function prefetchCharacterData(characterId) {
  if (!characterId) return;
  
  try {
    // Prefetch character details
    await queryClient.prefetchQuery({
      queryKey: [`/api/characters/${characterId}`],
      queryFn: async () => {
        const res = await fetch(`/api/characters/${characterId}`);
        if (!res.ok) throw new Error('Failed to fetch character');
        return res.json();
      }
    });
    
    // Prefetch inventory
    await queryClient.prefetchQuery({
      queryKey: [`/api/characters/${characterId}/inventory`],
      queryFn: async () => {
        const res = await fetch(`/api/characters/${characterId}/inventory`);
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
      }
    });
    
    // Prefetch currency
    await queryClient.prefetchQuery({
      queryKey: [`/api/characters/${characterId}/currency`],
      queryFn: async () => {
        const res = await fetch(`/api/characters/${characterId}/currency`);
        if (!res.ok) throw new Error('Failed to fetch currency');
        return res.json();
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error prefetching character data:', error);
    return false;
  }
}

// Get all characters for the current user
export async function fetchUserCharacters() {
  try {
    const res = await fetch('/api/characters');
    if (!res.ok) throw new Error('Failed to fetch characters');
    return await res.json();
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
}

// Get character inventory
export async function fetchCharacterInventory(characterId) {
  try {
    const res = await fetch(`/api/characters/${characterId}/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return await res.json();
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

// Get character currency
export async function fetchCharacterCurrency(characterId) {
  try {
    const res = await fetch(`/api/characters/${characterId}/currency`);
    if (!res.ok) throw new Error('Failed to fetch currency');
    return await res.json();
  } catch (error) {
    console.error('Error fetching currency:', error);
    return { gold: 0, silver: 0, copper: 0 };
  }
}

// Format currency for display
export function formatCurrency(currency) {
  if (!currency) return '0 copper';
  
  const parts = [];
  if (currency.gold) parts.push(`${currency.gold} gold`);
  if (currency.silver) parts.push(`${currency.silver} silver`);
  if (currency.copper) parts.push(`${currency.copper} copper`);
  
  return parts.join(', ') || '0 copper';
}