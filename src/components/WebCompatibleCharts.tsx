import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Simple web-compatible chart components
interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity?: number) => string;
  }>;
}

interface PieData {
  name: string;
  amount: number;
  color: string;
}

export const WebCompatibleLineChart = ({ 
  data, 
  width, 
  height 
}: { 
  data: ChartData; 
  width: number; 
  height: number; 
}) => {
  if (Platform.OS === 'web') {
    // Simple web fallback - just show the data in a table format
    return (
      <View style={[styles.webChartContainer, { width, height }]}>
        <Text style={styles.webChartTitle}>Monthly Trends</Text>
        <View style={styles.webChartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
        <View style={styles.webDataTable}>
          {data.labels.map((label, index) => (
            <View key={label} style={styles.dataRow}>
              <Text style={styles.monthLabel}>{label}</Text>
              <Text style={[styles.dataValue, { color: '#4CAF50' }]}>
                ${data.datasets[0]?.data[index]?.toFixed(0) || '0'}
              </Text>
              <Text style={[styles.dataValue, { color: '#F44336' }]}>
                ${data.datasets[1]?.data[index]?.toFixed(0) || '0'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For mobile, we'll import and use the actual chart
  try {
    const { LineChart } = require('react-native-chart-kit');
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: { borderRadius: 16 },
      propsForDots: { r: '6', strokeWidth: '2', stroke: '#007AFF' },
    };

    return (
      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  } catch (error) {
    return (
      <View style={[styles.errorContainer, { width, height }]}>
        <Text style={styles.errorText}>Chart not available</Text>
      </View>
    );
  }
};

export const WebCompatiblePieChart = ({ 
  data, 
  width, 
  height, 
  title 
}: { 
  data: PieData[]; 
  width: number; 
  height: number; 
  title: string; 
}) => {
  if (Platform.OS === 'web') {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    
    return (
      <View style={[styles.webChartContainer, { width, height }]}>
        <Text style={styles.webChartTitle}>{title}</Text>
        <View style={styles.pieDataContainer}>
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.amount / total * 100).toFixed(1) : '0';
            return (
              <View key={index} style={styles.pieDataRow}>
                <View style={[styles.pieColor, { backgroundColor: item.color }]} />
                <Text style={styles.pieLabel}>{item.name}</Text>
                <Text style={styles.pieValue}>${item.amount.toFixed(0)}</Text>
                <Text style={styles.piePercentage}>({percentage}%)</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // For mobile, use the actual pie chart
  try {
    const { PieChart } = require('react-native-chart-kit');
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    };

    return (
      <PieChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
      />
    );
  } catch (error) {
    return (
      <View style={[styles.errorContainer, { width, height }]}>
        <Text style={styles.errorText}>Chart not available</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  chart: {
    borderRadius: 16,
  },
  webChartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webChartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  webChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  webDataTable: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  pieDataContainer: {
    gap: 8,
  },
  pieDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  pieColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pieLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pieValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  piePercentage: {
    fontSize: 12,
    color: '#666',
    minWidth: 50,
    textAlign: 'right',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
