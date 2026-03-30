
import { useState, useEffect, useMemo } from 'react';
import { ShotData, SortOption } from '../types';

interface FilterState {
    bean: string | null;
    machine: string | null;
    minRating: number | null;
    dateRange: 'all' | 'week' | 'month';
    sort: SortOption;
}

const DEFAULT_FILTERS: FilterState = {
    bean: null,
    machine: null,
    minRating: null,
    dateRange: 'all',
    sort: 'date_desc'
};

export const useHistoryLogic = (shots: ShotData[]) => {
    const [activeModal, setActiveModal] = useState<'none' | 'filter_dashboard' | 'chat'>('none');
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [displayLimit, setDisplayLimit] = useState(20);

    useEffect(() => {
        setDisplayLimit(20);
    }, [filters]);

    const uniqueBeans = useMemo(() => {
        return Array.from(new Set(shots.map(s => s.beanName).filter(Boolean))).sort();
    }, [shots]);

    const uniqueMachines = useMemo(() => {
        return Array.from(new Set(shots.map(s => s.machineName).filter(Boolean))).sort();
    }, [shots]);

    const processedShots = useMemo(() => {
        let result = [...shots];

        if (filters.bean) result = result.filter(s => s.beanName === filters.bean);
        if (filters.machine) result = result.filter(s => s.machineName === filters.machine);
        if (filters.minRating) result = result.filter(s => (s.ratingOverall || 0) >= filters.minRating!);
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const past = new Date();
            if (filters.dateRange === 'week') past.setDate(now.getDate() - 7);
            if (filters.dateRange === 'month') past.setDate(now.getDate() - 30);
            result = result.filter(s => new Date(s.date) >= past);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            const rateA = a.ratingOverall || 0;
            const rateB = b.ratingOverall || 0;
            
            const ratioA = a.doseIn > 0 ? a.yieldOut / a.doseIn : 0;
            const ratioB = b.doseIn > 0 ? b.yieldOut / b.doseIn : 0;

            const getExpertScore = (s: ShotData) => {
                if (!s.structuredAnalysis?.score) return 0;
                return parseFloat(s.structuredAnalysis.score.split('/')[0]) || 0;
            };
            const expertA = getExpertScore(a);
            const expertB = getExpertScore(b);

            switch (filters.sort) {
                case 'date_asc': return dateA - dateB;
                case 'date_desc': return dateB - dateA;
                case 'rating_desc': return rateB - rateA || dateB - dateA;
                case 'rating_asc': return rateA - rateB || dateB - dateA;
                case 'expert_score_desc': return expertB - expertA || dateB - dateA;
                case 'expert_score_asc': return expertA - expertB || dateB - dateA;
                case 'ratio_desc': return ratioB - ratioA || dateB - dateA;
                case 'ratio_asc': return ratioA - ratioB || dateB - dateA;
                case 'time_desc': return (b.time || 0) - (a.time || 0);
                case 'time_asc': return (a.time || 0) - (b.time || 0);
                case 'temp_desc': return (b.temperature || 0) - (a.temperature || 0);
                case 'temp_asc': return (a.temperature || 0) - (b.temperature || 0);
                case 'grind_desc': return (b.grindSetting || 0) - (a.grindSetting || 0);
                case 'grind_asc': return (a.grindSetting || 0) - (b.grindSetting || 0);
                default: return dateB - dateA;
            }
        });

        return result;
    }, [shots, filters]);

    const visibleShots = useMemo(() => processedShots.slice(0, displayLimit), [processedShots, displayLimit]);
    const hasMore = processedShots.length > displayLimit;

    const latestShot = useMemo(() => {
        if (shots.length === 0) return null;
        return [...shots].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [shots]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.bean) count++;
        if (filters.machine) count++;
        if (filters.minRating) count++;
        if (filters.dateRange !== 'all') count++;
        if (filters.sort !== 'date_desc') count++;
        return count;
    }, [filters]);

    const toggleSort = (baseKey: string) => {
        setFilters(prev => {
            const current = prev.sort;
            const isSameKey = current.startsWith(baseKey);
            let newSort: SortOption;
            if (isSameKey) {
                newSort = current.endsWith('_desc') ? `${baseKey}_asc` as SortOption : `${baseKey}_desc` as SortOption;
            } else {
                newSort = `${baseKey}_desc` as SortOption;
            }
            return { ...prev, sort: newSort };
        });
    };

    const handleLoadMore = () => setDisplayLimit(prev => prev + 20);

    return {
        activeModal, setActiveModal,
        filters, setFilters,
        DEFAULT_FILTERS,
        uniqueBeans, uniqueMachines,
        processedShots, visibleShots, hasMore,
        latestShot,
        activeFilterCount,
        toggleSort,
        handleLoadMore,
        displayLimit
    };
};