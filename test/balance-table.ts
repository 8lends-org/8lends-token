import { formatUnits, formatEther } from "ethers";

// Types for balance tracking
export interface BalanceData {
  usdc: string;
  token: string;
}

export interface BalanceEntry {
  operation: string;
  balances: {
    investor: BalanceData;
    borrower: BalanceData;
    inviter: BalanceData;
    treasury: BalanceData;
    fundraise: BalanceData;
    rewardSystem: BalanceData;
  };
  pool: BalanceData;
  price: { tokenPrice: string };
  tokenSupply: string;
}

export class BalanceTable {
  private balanceHistory: BalanceEntry[] = [];

  /**
   * Helper function to pad strings to exact width
   */
  private pad(str: string, width: number): string {
    return str.padEnd(width);
  }

  /**
   * Helper function to format numbers with rounding and thousands separator
   */
  private formatNumber(value: string, decimals: number = 0): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Round to specified decimal places
    const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    // Format with appropriate decimal places
    let formatted = rounded.toFixed(decimals);
    
    // Add thousands separator (space) for integers
    if (decimals === 0) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    
    return formatted;
  }

  /**
   * Helper function to format price with 2 decimal places
   */
  private formatPrice(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Round to 2 decimal places for price
    const rounded = Math.round(num * 1000) / 1000;
    
    // Format with 2 decimal places
    return rounded.toFixed(4);
  }

  /**
   * Helper function to format balance with change indicator
   */
  private formatBalanceWithChange(current: string, previous: string, tokenType: string): string {
    const currentNum = parseFloat(current);
    const previousNum = parseFloat(previous || "0");
    const formatted = this.formatNumber(current, 0); // Round to integers
    
    if (previousNum === 0 && currentNum === 0) {
      return `${tokenType} ${formatted}`;
    }
    
    if (currentNum > previousNum) {
      return `📈 ${tokenType} ${formatted}`;
    } else if (currentNum < previousNum) {
      return `📉 ${tokenType} ${formatted}`;
    } else {
      return `${tokenType} ${formatted}`;
    }
  }

  /**
   * Smart word wrapping for operation name
   */
  private wrapText(text: string, width: number): string[] {
    if (text.length <= width) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      
      if (testLine.length <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word.length > width ? word.substring(0, width) : word;
        } else {
          // Single word is longer than width, force wrap
          lines.push(word.substring(0, width));
          currentLine = '';
        }
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }

  /**
   * Add a new balance entry to the history
   */
  addEntry(entry: BalanceEntry): void {
    this.balanceHistory.push(entry);
  }

  /**
   * Clear the balance history (useful for starting fresh in each test)
   */
  clearHistory(): void {
    this.balanceHistory.length = 0;
  }

  /**
   * Displays the cumulative balance tracking table
   */
  displayTable(): void {
    if (this.balanceHistory.length === 0) return;

    const OPERATION_WIDTH = 45;
    const BALANCE_WIDTH = 22;

    // Create the table header
    console.log(`\n📊 BALANCE TRACKING (${this.balanceHistory.length} operations):`);
    console.log("┌" + "─".repeat(OPERATION_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┬" + "─".repeat(BALANCE_WIDTH) + "┐");
    console.log("│" + this.pad("OPERATION", OPERATION_WIDTH) + "│" + this.pad("INVESTOR", BALANCE_WIDTH) + "│" + this.pad("BORROWER", BALANCE_WIDTH) + "│" + this.pad("INVITER", BALANCE_WIDTH) + "│" + this.pad("TREASURY", BALANCE_WIDTH) + "│" + this.pad("FUNDRAISE", BALANCE_WIDTH) + "│" + this.pad("REWARDS", BALANCE_WIDTH) + "│" + this.pad("POOL", BALANCE_WIDTH) + "│" + this.pad("PRICE", BALANCE_WIDTH) + "│" + this.pad("SUPPLY", BALANCE_WIDTH) + "│");
    console.log("├" + "─".repeat(OPERATION_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┤");

    // Display each operation
    for (let opIndex = 0; opIndex < this.balanceHistory.length; opIndex++) {
      const entry = this.balanceHistory[opIndex];
      const operationLines = this.wrapText(entry.operation, OPERATION_WIDTH);
      const maxLines = Math.max(operationLines.length, 2);
      const addresses = [entry.balances.investor, entry.balances.borrower, entry.balances.inviter, entry.balances.treasury, entry.balances.fundraise, entry.balances.rewardSystem];
      const poolData = entry.pool;
      const priceData = entry.price;
      const tokenSupply = entry.tokenSupply;
      
      for (let i = 0; i < maxLines; i++) {
        let line = "│";
        
        // Operation column
        if (i < operationLines.length) {
          line += this.pad(operationLines[i], OPERATION_WIDTH);
        } else {
          line += " ".repeat(OPERATION_WIDTH);
        }
        
        // Balance columns
        if (i === 0) {
          // Get previous entry once for all calculations
          const prevEntry = opIndex > 0 ? this.balanceHistory[opIndex - 1] : null;
          
          // First line shows USDC balances
          addresses.forEach((addr, addrIndex) => {
            const prevBalances = prevEntry ? [prevEntry.balances.investor, prevEntry.balances.borrower, prevEntry.balances.inviter, prevEntry.balances.treasury, prevEntry.balances.fundraise, prevEntry.balances.rewardSystem] : [];
            const prevUsdc = prevBalances[addrIndex] ? prevBalances[addrIndex].usdc : "0";
            
            line += "│" + this.pad(this.formatBalanceWithChange(addr.usdc, prevUsdc, "USDC"), BALANCE_WIDTH);
          });
          
          // Add POOL USDC balance
          const prevPoolUsdc = prevEntry ? prevEntry.pool.usdc : "0";
          line += "│" + this.pad(this.formatBalanceWithChange(poolData.usdc, prevPoolUsdc, "USDC"), BALANCE_WIDTH);
          
          // Add PRICE column (only on first line)
          line += "│" + this.pad(`$${this.formatPrice(priceData.tokenPrice)}`, BALANCE_WIDTH);
          
          // Add SUPPLY column (only on first line)
          const prevSupply = prevEntry ? prevEntry.tokenSupply : "0";
          const supplyFormatted = this.formatNumber(tokenSupply, 0);
          const supplyNum = parseFloat(tokenSupply);
          const prevSupplyNum = parseFloat(prevSupply || "0");
          let supplyDisplay = `Token ${supplyFormatted}`;
          if (supplyNum > prevSupplyNum) {
            supplyDisplay = `📈 Token ${supplyFormatted}`;
          } else if (supplyNum < prevSupplyNum) {
            supplyDisplay = `📉 Token ${supplyFormatted}`;
          }
          line += "│" + this.pad(supplyDisplay, BALANCE_WIDTH);
        } else if (i === 1) {
          // Second line shows Token balances
          addresses.forEach((addr, addrIndex) => {
            const prevEntry = opIndex > 0 ? this.balanceHistory[opIndex - 1] : null;
            const prevBalances = prevEntry ? [prevEntry.balances.investor, prevEntry.balances.borrower, prevEntry.balances.inviter, prevEntry.balances.treasury, prevEntry.balances.fundraise, prevEntry.balances.rewardSystem] : [];
            const prevToken = prevBalances[addrIndex] ? prevBalances[addrIndex].token : "0";
            
            line += "│" + this.pad(this.formatBalanceWithChange(addr.token, prevToken, "Token"), BALANCE_WIDTH);
          });
          
          // Add POOL Token balance
          const prevEntry = opIndex > 0 ? this.balanceHistory[opIndex - 1] : null;
          const prevPoolToken = prevEntry ? prevEntry.pool.token : "0";
          line += "│" + this.pad(this.formatBalanceWithChange(poolData.token, prevPoolToken, "Token"), BALANCE_WIDTH);
          
          // Add empty PRICE and SUPPLY columns
          line += "│" + " ".repeat(BALANCE_WIDTH);
          line += "│" + " ".repeat(BALANCE_WIDTH);
        } else {
          // Additional lines for operation name (empty balance columns)
          addresses.forEach(() => {
            line += "│" + " ".repeat(BALANCE_WIDTH);
          });
          
          // Add empty POOL, PRICE and SUPPLY columns
          line += "│" + " ".repeat(BALANCE_WIDTH);
          line += "│" + " ".repeat(BALANCE_WIDTH);
          line += "│" + " ".repeat(BALANCE_WIDTH);
        }
          
        line += "│";
        console.log(line);
        
        // Add separator line after USDC line (if there are more operation lines)
        if (i === 0 && operationLines.length > 1) {
          console.log("├" + "─".repeat(OPERATION_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┤");
        }
      }
      
      // Add separator between operations (except after the last one)
      if (opIndex < this.balanceHistory.length - 1) {
        console.log("├" + "─".repeat(OPERATION_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┼" + "─".repeat(BALANCE_WIDTH) + "┤");
      }
    }

    console.log("└" + "─".repeat(OPERATION_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┴" + "─".repeat(BALANCE_WIDTH) + "┘");
  }

  /**
   * Get current balance history
   */
  getHistory(): BalanceEntry[] {
    return this.balanceHistory;
  }

  /**
   * Get latest entry
   */
  getLatestEntry(): BalanceEntry | null {
    return this.balanceHistory.length > 0 ? this.balanceHistory[this.balanceHistory.length - 1] : null;
  }
}
