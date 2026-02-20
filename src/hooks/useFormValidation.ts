'use client';

import { useMemo } from 'react';
import type { WorkflowStep } from '@/data/types';

export interface ValidationErrors {
  title?: string;
  stepType?: string;
  impact?: string;
}

export function useFormValidation(data: Partial<WorkflowStep>) {
  const errors = useMemo<ValidationErrors>(() => {
    const errs: ValidationErrors = {};

    if (!data.title?.trim()) {
      errs.title = 'Title is required';
    }

    if (!data.stepType) {
      errs.stepType = 'Step type is required';
    }

    if (data.impact) {
      const { consistency, cost, control } = data.impact;
      if (
        consistency < 1 || consistency > 5 ||
        cost < 1 || cost > 5 ||
        control < 1 || control > 5
      ) {
        errs.impact = 'Impact scores must be between 1 and 5';
      }
    }

    return errs;
  }, [data.title, data.stepType, data.impact]);

  const isValid = Object.keys(errors).length === 0;

  return { errors, isValid };
}
