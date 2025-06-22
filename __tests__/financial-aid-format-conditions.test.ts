import { formatConditions } from "../lib/financialAidService";
import type { ApiAidGroup } from "../types/financialAidTypes";

describe("Financial Aid - formatConditions", () => {
  // Test case 1: Object format for groupe_racine (Paris example from API docs)
  it("should correctly format conditions from an object structure", () => {
    // Sample from actual API response for Paris (75056)
    const groupeRacineObject: ApiAidGroup = {
      type: "ET",
      libelle: "Groupe racine",
      groupes_fils: [],
      conditions: [
        { libelle: "Cuve aérienne" },
        { libelle: "Installation d'une cuve d'un volume de récupération de 3 m3 minimum." }
      ]
    };

    const result = formatConditions(groupeRacineObject);
    expect(result).toBe("Cuve aérienne; Installation d'une cuve d'un volume de récupération de 3 m3 minimum.");
  });

  // Test case 2: Array format for groupe_racine (schema example from API docs)
  it("should correctly format conditions from an array structure", () => {
    // Sample from API schema documentation
    const groupeRacineArray: ApiAidGroup[] = [
      {
        type: "ET",
        libelle: "Groupe Racine",
        conditions: [{ libelle: "Etre propriétaire occupant" }],
        groupes_fils: [{}] as any
      }
    ];

    const result = formatConditions(groupeRacineArray);
    expect(result).toBe("Etre propriétaire occupant");
  });

  // Test case 3: Multiple conditions in both formats
  it("should join multiple conditions with semicolons", () => {
    const multipleConditions: ApiAidGroup = {
      conditions: [
        { libelle: "Condition 1" },
        { libelle: "Condition 2" },
        { libelle: "Condition 3" }
      ]
    };

    const result = formatConditions(multipleConditions);
    expect(result).toBe("Condition 1; Condition 2; Condition 3");
  });

  // Test case 4: Edge case - null or undefined
  it("should handle null or undefined groupe_racine", () => {
    expect(formatConditions(null)).toBe("Conditions non spécifiées");
    expect(formatConditions(undefined)).toBe("Conditions non spécifiées");
  });

  // Test case 5: Edge case - empty array or object with no conditions
  it("should handle empty conditions array", () => {
    expect(formatConditions([])).toBe("Conditions non spécifiées");
    expect(formatConditions([{ conditions: [] }])).toBe("Conditions non spécifiées");
    expect(formatConditions({ conditions: [] })).toBe("Conditions non spécifiées");
  });

  // Test case 6: Edge case - missing conditions property
  it("should handle missing conditions property", () => {
    const noConditions: any = { 
      type: "ET",
      libelle: "Groupe sans conditions"
      // No conditions property
    };
    
    expect(formatConditions(noConditions)).toBe("Conditions non spécifiées");
  });

  // Test case 7: Real-world example - Ile-de-France aid
  it("should format conditions from real-world API response", () => {
    // From the API documentation example (Ile-de-France aid)
    const realWorldExample: ApiAidGroup = {
      type: "ET",
      libelle: "Groupe racine",
      groupes_fils: [],
      conditions: [
        { libelle: "Cuve enterrée" },
        { libelle: "Cuve d'une contenance de 5000L" }
      ]
    };

    const result = formatConditions(realWorldExample);
    expect(result).toBe("Cuve enterrée; Cuve d'une contenance de 5000L");
  });

  // Test case 8: Mixed case - array with some empty conditions
  it("should filter out empty or null condition labels", () => {
    const mixedConditions: ApiAidGroup[] = [
      {
        conditions: [
          { libelle: "Valid condition" },
          { libelle: "" },  // Empty string
          { libelle: null } as any  // Null value
        ]
      }
    ];

    const result = formatConditions(mixedConditions);
    expect(result).toBe("Valid condition");
  });
});
