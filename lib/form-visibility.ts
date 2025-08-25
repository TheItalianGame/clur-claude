export interface VisibilityRule {
  fieldId: string;
  conditions: VisibilityCondition[];
  logic: 'AND' | 'OR';
}

export interface VisibilityCondition {
  targetFieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
  value?: any;
}

export function evaluateVisibility(
  rule: VisibilityRule,
  formData: any,
  fields: any[]
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) {
    return true;
  }

  const results = rule.conditions.map(condition => {
    const targetField = fields.find(f => f.id === condition.targetFieldId);
    if (!targetField) return true;

    const fieldValue = formData[targetField.field_name];

    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value;
      
      case 'not_equals':
        return fieldValue != condition.value;
      
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        return String(fieldValue || '').includes(String(condition.value || ''));
      
      case 'not_contains':
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(condition.value);
        }
        return !String(fieldValue || '').includes(String(condition.value || ''));
      
      case 'empty':
        return !fieldValue || 
               (Array.isArray(fieldValue) && fieldValue.length === 0) ||
               (typeof fieldValue === 'string' && fieldValue.trim() === '');
      
      case 'not_empty':
        return fieldValue && 
               !(Array.isArray(fieldValue) && fieldValue.length === 0) &&
               !(typeof fieldValue === 'string' && fieldValue.trim() === '');
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
      default:
        return true;
    }
  });

  if (rule.logic === 'AND') {
    return results.every(r => r);
  } else {
    return results.some(r => r);
  }
}

export interface DynamicValidation {
  fieldId: string;
  rules: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  conditions?: VisibilityCondition[];
  conditionLogic?: 'AND' | 'OR';
}

export function validateField(
  fieldId: string,
  fieldValue: any,
  validations: DynamicValidation[],
  formData: any,
  fields: any[]
): string | null {
  const fieldValidations = validations.find(v => v.fieldId === fieldId);
  if (!fieldValidations) return null;

  for (const rule of fieldValidations.rules) {
    // Check if rule should apply based on conditions
    if (rule.conditions && rule.conditions.length > 0) {
      const shouldApply = evaluateVisibility(
        {
          fieldId,
          conditions: rule.conditions,
          logic: rule.conditionLogic || 'AND'
        },
        formData,
        fields
      );
      
      if (!shouldApply) continue;
    }

    // Apply validation rule
    switch (rule.type) {
      case 'required':
        if (!fieldValue || 
            (Array.isArray(fieldValue) && fieldValue.length === 0) ||
            (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          return rule.message || 'This field is required';
        }
        break;
      
      case 'min':
        if (typeof fieldValue === 'number' && fieldValue < rule.value) {
          return rule.message || `Value must be at least ${rule.value}`;
        }
        if (typeof fieldValue === 'string' && fieldValue.length < rule.value) {
          return rule.message || `Must be at least ${rule.value} characters`;
        }
        if (Array.isArray(fieldValue) && fieldValue.length < rule.value) {
          return rule.message || `Select at least ${rule.value} items`;
        }
        break;
      
      case 'max':
        if (typeof fieldValue === 'number' && fieldValue > rule.value) {
          return rule.message || `Value must be at most ${rule.value}`;
        }
        if (typeof fieldValue === 'string' && fieldValue.length > rule.value) {
          return rule.message || `Must be at most ${rule.value} characters`;
        }
        if (Array.isArray(fieldValue) && fieldValue.length > rule.value) {
          return rule.message || `Select at most ${rule.value} items`;
        }
        break;
      
      case 'pattern':
        const regex = new RegExp(rule.value);
        if (!regex.test(String(fieldValue || ''))) {
          return rule.message || 'Invalid format';
        }
        break;
    }
  }

  return null;
}

export interface FieldDependency {
  fieldId: string;
  dependencies: {
    targetFieldId: string;
    action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
    conditions: VisibilityCondition[];
    logic: 'AND' | 'OR';
  }[];
}

export function getFieldState(
  fieldId: string,
  dependencies: FieldDependency[],
  formData: any,
  fields: any[]
): {
  visible: boolean;
  disabled: boolean;
  required: boolean;
} {
  const fieldDeps = dependencies.find(d => d.fieldId === fieldId);
  
  let state = {
    visible: true,
    disabled: false,
    required: fields.find(f => f.id === fieldId)?.is_required || false
  };

  if (!fieldDeps) return state;

  fieldDeps.dependencies.forEach(dep => {
    const shouldApply = evaluateVisibility(
      {
        fieldId,
        conditions: dep.conditions,
        logic: dep.logic
      },
      formData,
      fields
    );

    if (shouldApply) {
      switch (dep.action) {
        case 'show':
          state.visible = true;
          break;
        case 'hide':
          state.visible = false;
          break;
        case 'enable':
          state.disabled = false;
          break;
        case 'disable':
          state.disabled = true;
          break;
        case 'require':
          state.required = true;
          break;
        case 'optional':
          state.required = false;
          break;
      }
    }
  });

  return state;
}