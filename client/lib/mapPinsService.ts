import { hasuraClient, executeQuery, executeMutation } from "./hasura";

export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: "adventure" | "photo" | "memory" | "wishlist";
  date?: string;
  created_at?: string;
  updated_at?: string;
}

// GraphQL Queries
const GET_MAP_PINS = `
  query GetMapPins {
    map_pins(order_by: {created_at: desc}) {
      id
      latitude
      longitude
      title
      description
      category
      date
      created_at
      updated_at
    }
  }
`;

const INSERT_MAP_PIN = `
  mutation InsertMapPin($pin: map_pins_insert_input!) {
    insert_map_pins_one(object: $pin) {
      id
      latitude
      longitude
      title
      description
      category
      date
      created_at
      updated_at
    }
  }
`;

const UPDATE_MAP_PIN = `
  mutation UpdateMapPin($id: uuid!, $pin: map_pins_set_input!) {
    update_map_pins_by_pk(pk_columns: {id: $id}, _set: $pin) {
      id
      latitude
      longitude
      title
      description
      category
      date
      created_at
      updated_at
    }
  }
`;

const DELETE_MAP_PIN = `
  mutation DeleteMapPin($id: uuid!) {
    delete_map_pins_by_pk(id: $id) {
      id
    }
  }
`;

const GET_MAP_PINS_BY_CATEGORY = `
  query GetMapPinsByCategory($category: String!) {
    map_pins(where: {category: {_eq: $category}}, order_by: {created_at: desc}) {
      id
      latitude
      longitude
      title
      description
      category
      date
      created_at
      updated_at
    }
  }
`;

/**
 * Get all map pins from the database
 */
export async function getMapPins(): Promise<MapPin[]> {
  try {
    console.log("📍 Fetching map pins from Hasura database...");

    const response = await executeQuery<{ map_pins: MapPin[] }>(GET_MAP_PINS);
    const pins = response.map_pins || [];

    console.log(`✅ Successfully fetched ${pins.length} map pins from Hasura`);
    return pins;
  } catch (error) {
    console.error("❌ Error fetching map pins from Hasura:", error);
    console.log("📍 Returning empty array as fallback");
    return [];
  }
}

/**
 * Add a new map pin to the database
 */
export async function addMapPin(
  pin: Omit<MapPin, "id" | "created_at" | "updated_at">,
): Promise<MapPin> {
  try {
    console.log("📍 Adding new map pin to Hasura:", pin.title);

    const response = await executeMutation<{ insert_map_pins_one: MapPin }>(
      INSERT_MAP_PIN,
      {
        pin: {
          latitude: pin.latitude,
          longitude: pin.longitude,
          title: pin.title,
          description: pin.description,
          category: pin.category,
          date: pin.date,
        },
      }
    );

    if (!response.insert_map_pins_one) {
      throw new Error("Failed to insert map pin");
    }

    console.log("✅ Successfully added map pin to Hasura:", response.insert_map_pins_one.title);
    return response.insert_map_pins_one;
  } catch (error) {
    console.error("❌ Error adding map pin to Hasura:", error);
    throw error;
  }
}

/**
 * Update an existing map pin
 */
export async function updateMapPin(
  id: string,
  updates: Partial<Omit<MapPin, "id" | "created_at" | "updated_at">>,
): Promise<MapPin> {
  try {
    console.log("📍 Updating map pin in Hasura:", id);

    const response = await executeMutation<{ update_map_pins_by_pk: MapPin }>(
      UPDATE_MAP_PIN,
      {
        id,
        pin: {
          ...updates,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (!response.update_map_pins_by_pk) {
      throw new Error(`Failed to update map pin with ID: ${id}`);
    }

    console.log("✅ Successfully updated map pin in Hasura:", response.update_map_pins_by_pk.title);
    return response.update_map_pins_by_pk;
  } catch (error) {
    console.error("❌ Error updating map pin in Hasura:", error);
    throw error;
  }
}

/**
 * Delete a map pin from the database
 */
export async function deleteMapPin(id: string): Promise<void> {
  try {
    console.log("📍 Deleting map pin from Hasura with ID:", id);

    if (!id) {
      throw new Error("Pin ID is required for deletion");
    }

    const response = await executeMutation<{ delete_map_pins_by_pk: { id: string } }>(
      DELETE_MAP_PIN,
      { id }
    );

    if (!response.delete_map_pins_by_pk) {
      throw new Error(`Failed to delete map pin with ID: ${id}`);
    }

    console.log("✅ Successfully deleted map pin from Hasura:", response.delete_map_pins_by_pk.id);
  } catch (error) {
    console.error("❌ Error deleting map pin from Hasura:", error);
    throw error;
  }
}

/**
 * Subscribe to real-time map pin changes (polling-based for Hasura)
 */
export function subscribeToMapPins(
  callback: (pins: MapPin[]) => void,
): () => void {
  console.log("📍 Setting up real-time sync for map pins (polling-based)...");

  // Initial fetch
  getMapPins().then(callback).catch(console.error);

  // Set up polling for real-time-like updates
  const pollInterval = setInterval(() => {
    console.log("📍 Polling for map pin updates...");
    getMapPins().then(callback).catch(console.error);
  }, 5000); // Poll every 5 seconds

  // Return unsubscribe function
  return () => {
    console.log("📍 Stopping map pins polling");
    clearInterval(pollInterval);
  };
}

/**
 * Get map pins by category
 */
export async function getMapPinsByCategory(
  category: MapPin["category"],
): Promise<MapPin[]> {
  try {
    console.log("📍 Fetching map pins by category from Hasura:", category);

    const response = await executeQuery<{ map_pins: MapPin[] }>(
      GET_MAP_PINS_BY_CATEGORY,
      { category }
    );

    const pins = response.map_pins || [];

    console.log(
      `✅ Successfully fetched ${pins.length} ${category} pins from Hasura`,
    );
    return pins;
  } catch (error) {
    console.error("❌ Error fetching map pins by category from Hasura:", error);
    return [];
  }
}

/**
 * Get map pins statistics
 */
export async function getMapPinsStats(): Promise<{
  total: number;
  byCategory: Record<MapPin["category"], number>;
}> {
  try {
    const pins = await getMapPins();

    const stats = {
      total: pins.length,
      byCategory: {
        adventure: pins.filter((p) => p.category === "adventure").length,
        photo: pins.filter((p) => p.category === "photo").length,
        memory: pins.filter((p) => p.category === "memory").length,
        wishlist: pins.filter((p) => p.category === "wishlist").length,
      },
    };

    console.log("📍 Map pins stats:", stats);
    return stats;
  } catch (error) {
    console.error("Error in getMapPinsStats:", error);
    throw error;
  }
}
