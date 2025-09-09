# Daily Sub Activities API for React Native Infinite Scroll

## Overview
API `GET /api/daily-sub-activities/list` sudah compatible dengan infinite scroll pattern di React Native. API menggunakan pagination standard yang mudah diintegrasikan dengan FlatList atau SectionList.

## Infinite Scroll Pattern

### Response Structure for Pagination
```json
{
  "success": true,
  "data": [...], // Array of daily sub activities
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,  // ← Key for infinite scroll
    "hasPrev": false
  }
}
```

### Key Fields for Infinite Scroll
- `pagination.hasNext`: Boolean to determine if more data is available
- `pagination.page`: Current page number
- `data[]`: Array of items to append to your list

## React Native Integration Example

### Using with FlatList
```javascript
// React Native component example
import React, { useState, useCallback } from 'react'
import { FlatList, ActivityIndicator, View, Text } from 'react-native'

const DailySubActivitiesList = ({ projectId, search }) => {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading && !isRefresh) return
    
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
      
      // Add optional filters
      if (projectId) params.append('projectId', projectId)
      if (search) params.append('search', search)
      
      const response = await fetch(
        `${API_BASE_URL}/api/daily-sub-activities/list?${params.toString()}`
      )
      
      const result = await response.json()
      
      if (result.success) {
        if (isRefresh || pageNum === 1) {
          setData(result.data)
        } else {
          setData(prev => [...prev, ...result.data])
        }
        
        setHasNextPage(result.pagination.hasNext)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [projectId, search, loading])

  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      fetchData(page + 1)
    }
  }, [page, hasNextPage, loading, fetchData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData(1, true)
  }, [fetchData])

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>{item.subActivity.name}</Text>
      <Text style={styles.progress}>{item.progresRealisasiPerHari}%</Text>
      <Text style={styles.date}>{item.tanggalProgres}</Text>
    </View>
  )

  const renderFooter = () => {
    if (!loading) return null
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.1}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListFooterComponent={renderFooter}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  )
}
```

## Recommended Query Parameters for Mobile

### Optimal Performance Settings
```
limit=20          // Good balance between network calls and memory
sortBy=updatedAt   // Most recent first
sortOrder=desc     // Latest updates on top
```

### Common Filter Combinations

1. **Project-specific activities**:
   ```
   GET /api/daily-sub-activities/list?projectId=cm123&limit=20&page=1
   ```

2. **Search with infinite scroll**:
   ```
   GET /api/daily-sub-activities/list?search=galian&limit=15&page=1
   ```

3. **Date range with infinite scroll**:
   ```
   GET /api/daily-sub-activities/list?startDate=2024-01-01&endDate=2024-01-31&limit=20&page=1
   ```

## Mobile-Optimized Response

API response sudah dioptimalkan untuk mobile dengan:

- ✅ **Efficient payload**: Hanya data yang diperlukan
- ✅ **Consistent structure**: Sama untuk setiap page
- ✅ **Clear pagination metadata**: `hasNext`, `totalPages`, dll
- ✅ **Error handling**: Consistent error response format

## Network Optimization Tips

1. **Cache Strategy**: 
   - Cache first page untuk offline access
   - Implement stale-while-revalidate pattern

2. **Batch Size**:
   - WiFi: `limit=20-30`
   - Mobile Data: `limit=10-15`

3. **Prefetching**:
   - Load next page when user reaches 80% of current list
   - Use `onEndReachedThreshold={0.2}`

## Error Handling for Mobile

```javascript
const handleError = (error) => {
  if (!error.success) {
    switch (error.error) {
      case 'Validation Error':
        // Handle invalid parameters
        break
      case 'Database Error':
        // Show retry option
        break
      default:
        // Show generic error message
        break
    }
  }
}
```

## Testing Infinite Scroll

```javascript
// Test pagination flow
const testInfiniteScroll = async () => {
  // Page 1
  const page1 = await fetch('/api/daily-sub-activities/list?page=1&limit=5')
  const data1 = await page1.json()
  
  console.log('Page 1:', data1.data.length, 'items')
  console.log('Has next:', data1.pagination.hasNext)
  
  if (data1.pagination.hasNext) {
    // Page 2
    const page2 = await fetch('/api/daily-sub-activities/list?page=2&limit=5')
    const data2 = await page2.json()
    
    console.log('Page 2:', data2.data.length, 'items')
    console.log('Total so far:', data1.data.length + data2.data.length)
  }
}
```

## Summary

API Daily Sub Activities sudah siap untuk infinite scroll di React Native:

- ✅ **Pagination ready**: Gunakan `page` dan `limit` parameters
- ✅ **HasNext indicator**: Check `pagination.hasNext` untuk load more
- ✅ **Consistent response**: Same structure untuk setiap page
- ✅ **Mobile optimized**: Efficient payload dan error handling
- ✅ **Filter compatible**: Semua filter tetap bekerja dengan pagination

Tinggal implementasi di React Native side menggunakan FlatList dengan `onEndReached` callback! 🚀
