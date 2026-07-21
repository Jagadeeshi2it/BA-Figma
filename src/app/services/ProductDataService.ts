/**
 * Product Data Service - Centralized Product Information Management
 * 
 * This service handles all product data operations and ensures proper 
 * display of product information throughout the application.
 * 
 * RESPONSIBILITIES:
 * - Map product IDs to human-readable information
 * - Provide consistent product data interface
 * - Handle product lookup and resolution
 * - Maintain product master data relationships
 */

import { pharmaceuticalProducts, type MasterProduct } from '../data/products';

export interface ProductDisplayInfo {
  id: string;
  name: string;
  displayName: string;
  genericName: string;
  ndc: string;
  inventoryType: string;
  vialType: string;
  source: string;
  unit: string;
  description: string;
  quantity?: number;
}

export interface ProductLookupResult {
  found: boolean;
  product?: ProductDisplayInfo;
  masterProductId?: string;
}

/**
 * Product Data Service Class
 * Handles all product data operations and display information
 */
export class ProductDataService {
  private masterProducts: Map<string, MasterProduct>;
  private productCache: Map<string, ProductDisplayInfo>;
  private initialized: boolean = false;

  constructor() {
    this.masterProducts = new Map();
    this.productCache = new Map();
    // Don't initialize immediately - use lazy initialization
  }

  /**
   * Initialize master product lookup lazily
   */
  private initializeMasterProducts(): void {
    if (this.initialized) {
      return;
    }

    try {
      // Add defensive check for pharmaceuticalProducts
      if (typeof pharmaceuticalProducts === 'undefined') {
        console.error('ProductDataService: pharmaceuticalProducts is undefined - module import may have failed');
        this.initialized = true; // Mark as initialized even if failed to prevent retries
        return;
      }

      if (!Array.isArray(pharmaceuticalProducts)) {
        console.error('ProductDataService: pharmaceuticalProducts is not an array:', typeof pharmaceuticalProducts, pharmaceuticalProducts);
        this.initialized = true; // Mark as initialized even if failed to prevent retries
        return;
      }

      if (pharmaceuticalProducts.length === 0) {
        console.warn('ProductDataService: pharmaceuticalProducts array is empty');
      }

      pharmaceuticalProducts.forEach(product => {
        if (product && product.id) {
          this.masterProducts.set(product.id, product);
        } else {
          console.warn('ProductDataService: Invalid product found:', product);
        }
      });

      this.initialized = true;
      console.log(`ProductDataService: Initialized ${this.masterProducts.size} master products`);
    } catch (error) {
      console.error('ProductDataService: Error during initialization:', error);
      this.initialized = true; // Mark as initialized to prevent retries
    }
  }

  /**
   * Extract master product ID from a generated product ID
   * Generated IDs follow patterns: 
   * - PROD###_timestamp_randomstring (uppercase)
   * - prod###_timestamp_randomstring (lowercase)
   * - PROD### (direct master ID)
   */
  private extractMasterProductId(productId: string): string | null {
    // Handle direct master product IDs (both cases)
    if (this.masterProducts.has(productId)) {
      return productId;
    }
    
    // Try uppercase version if productId is lowercase
    const upperProductId = productId.toUpperCase();
    if (this.masterProducts.has(upperProductId)) {
      return upperProductId;
    }

    // Extract from generated IDs (handle both PROD### and prod### patterns)
    const match = productId.match(/^(PROD\d+|prod\d+)_/i);
    if (match) {
      // Always convert to uppercase to match master product IDs
      const extractedId = match[1].toUpperCase();
      if (this.masterProducts.has(extractedId)) {
        return extractedId;
      }
    }

    // Fallback: check if it starts with any master product ID (case insensitive)
    for (const masterProductId of this.masterProducts.keys()) {
      if (productId.toLowerCase().startsWith(masterProductId.toLowerCase())) {
        return masterProductId;
      }
    }

    return null;
  }

  /**
   * Get product display information by product ID
   */
  public getProductDisplayInfo(productId: string, quantity?: number): ProductLookupResult {
    // Ensure initialization
    this.initializeMasterProducts();

    // Check cache first
    const cacheKey = `${productId}_${quantity || 'no_qty'}`;
    if (this.productCache.has(cacheKey)) {
      return {
        found: true,
        product: this.productCache.get(cacheKey)!
      };
    }

    // Extract master product ID
    const masterProductId = this.extractMasterProductId(productId);
    if (!masterProductId) {
      // Debug logging for failed lookups
      console.warn(`ProductDataService: Could not find master product for ID: ${productId}`);
      return { found: false };
    }

    const masterProduct = this.masterProducts.get(masterProductId);
    if (!masterProduct) {
      console.warn(`ProductDataService: Master product not found for extracted ID: ${masterProductId} from original ID: ${productId}`);
      return { found: false };
    }

    // Create display info
    const displayInfo: ProductDisplayInfo = {
      id: productId,
      name: masterProduct.displayName,
      displayName: masterProduct.displayName,
      genericName: masterProduct.genericName,
      ndc: masterProduct.ndc,
      inventoryType: masterProduct.inventoryType,
      vialType: masterProduct.vialType,
      source: masterProduct.source,
      unit: masterProduct.defaultUnit,
      description: masterProduct.genericName,
      quantity: quantity
    };

    // Cache the result
    this.productCache.set(cacheKey, displayInfo);

    return {
      found: true,
      product: displayInfo,
      masterProductId
    };
  }

  /**
   * Enhance a product object with proper display information
   */
  public enhanceProduct(product: any): any {
    if (!product || !product.id) {
      return product;
    }

    // Handle special unallocated product IDs (unalloc-1, unalloc-2, etc.)
    if (product.id.startsWith('unalloc-')) {
      // For unallocated products, the product object already contains all the necessary data
      // Just ensure consistent format and add any missing fields
      return {
        ...product,
        name: product.name || product.displayName || `Product ${product.id}`,
        displayName: product.displayName || product.name || `Product ${product.id}`,
        genericName: product.genericName || product.description || '',
        ndc: product.ndc || 'Not Available',
        inventoryType: product.inventoryType || 'Unknown',
        vialType: product.vialType || product.badge || 'SDV',
        source: product.source || 'Unknown',
        description: product.description || product.genericName || '',
        unit: product.unit || 'units'
      };
    }

    const lookupResult = this.getProductDisplayInfo(product.id, product.quantity);
    if (!lookupResult.found) {
      // Provide better fallbacks when lookup fails
      console.warn(`ProductDataService: Enhancement failed for product ID: ${product.id}, using fallbacks`);
      return {
        ...product,
        name: product.name || `Product ${product.id}`,
        displayName: product.displayName || product.name || `Product ${product.id}`,
        genericName: product.genericName || product.description || product.name || '',
        ndc: product.ndc || 'Not Available',
        inventoryType: product.inventoryType || 'Unknown',
        vialType: product.vialType || 'SDV',
        source: product.source || 'Unknown',
        description: product.description || product.genericName || product.name || '',
        unit: product.unit || 'units'
      };
    }

    // Merge the enhanced data with existing product data
    return {
      ...product,
      name: lookupResult.product!.name,
      displayName: lookupResult.product!.displayName,
      genericName: lookupResult.product!.genericName,
      ndc: lookupResult.product!.ndc,
      inventoryType: lookupResult.product!.inventoryType,
      vialType: lookupResult.product!.vialType,
      source: lookupResult.product!.source,
      description: lookupResult.product!.description,
      unit: lookupResult.product!.unit
    };
  }

  /**
   * Enhance multiple products
   */
  public enhanceProducts(products: any[]): any[] {
    return products.map(product => this.enhanceProduct(product));
  }

  /**
   * Get inventory type for a product ID
   */
  public getInventoryType(productId: string): string {
    const lookupResult = this.getProductDisplayInfo(productId);
    return lookupResult.found ? lookupResult.product!.inventoryType : 'Unknown';
  }

  /**
   * Get product name for a product ID
   */
  public getProductName(productId: string): string {
    const lookupResult = this.getProductDisplayInfo(productId);
    return lookupResult.found ? lookupResult.product!.name : productId;
  }

  /**
   * Get all master products
   */
  public getMasterProducts(): MasterProduct[] {
    this.initializeMasterProducts();
    return Array.from(this.masterProducts.values());
  }

  /**
   * Search products by name or NDC
   */
  public searchProducts(query: string): MasterProduct[] {
    this.initializeMasterProducts();
    const lowerQuery = query.toLowerCase();
    return Array.from(this.masterProducts.values()).filter(product =>
      product.displayName.toLowerCase().includes(lowerQuery) ||
      product.ndc.includes(query) ||
      product.genericName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.productCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; masterProductCount: number } {
    return {
      size: this.productCache.size,
      masterProductCount: this.masterProducts.size
    };
  }

  /**
   * Debug method to test product lookup
   */
  public debugLookup(productId: string): any {
    console.log(`=== ProductDataService Debug for ID: ${productId} ===`);
    
    // Test extraction
    const extractedId = this.extractMasterProductId(productId);
    console.log(`Extracted master ID: ${extractedId}`);
    
    if (extractedId) {
      const masterProduct = this.masterProducts.get(extractedId);
      console.log(`Found master product:`, masterProduct);
    }
    
    // Test full lookup
    const result = this.getProductDisplayInfo(productId);
    console.log(`Lookup result:`, result);
    
    return result;
  }
}

// Singleton instance for application-wide use
export const productDataService = new ProductDataService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).productDataService = productDataService;
}

// Export types for external use
export type { ProductDisplayInfo, ProductLookupResult };