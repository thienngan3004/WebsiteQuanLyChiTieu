import React, { useState } from 'react';

const FinancialCharts = ({ lineChartData, lineChartOptions }) => {
  // state dùng để theo dõi tab nào đang được chọn (mặc định là 'expense')
  const [activeTab, setActiveTab] = useState('expense');

  // 1. Tách dữ liệu ra thành 2 mảng riêng biệt Thu và Chi từ data gốc
  const expenseData = chartData.filter(item => item.type === 'expense');
  const incomeData = chartData.filter(item => item.type === 'income');

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto my-6">
      
      {/* HEADER & TAB TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Báo cáo thu chi theo danh mục</h2>
          <p className="text-sm text-gray-500">Xem chi tiết hạn mức chi tiêu và các nguồn thu nhập</p>
        </div>

        {/* Cụm nút bấm chuyển Tab Toggle bằng Tailwind */}
        <div className="flex p-1 bg-gray-100 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'expense'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Biểu đồ Chi tiêu
          </button>
          
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'income'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💰 Biểu đồ Thu nhập
          </button>
        </div>
      </div>

      {/* RENDER BIỂU ĐỒ THEO TAB ĐANG ACTIVE */}
      <div className="transition-all duration-300 min-h-[350px] flex items-center justify-center">
        {activeTab === 'expense' ? (
          <div className="w-full animate-fadeIn">
            {expenseData.length > 0 ? (
              <ExpenseChart expenseData={expenseData} />
            ) : (
              <p className="text-gray-400 text-center py-10">Chưa có dữ liệu chi tiêu nào trong khoảng thời gian này.</p>
            )}
          </div>
        ) : (
          <div className="w-full animate-fadeIn">
            {incomeData.length > 0 ? (
              <IncomeChart incomeData={incomeData} />
            ) : (
              <p className="text-gray-400 text-center py-10">Chưa có dữ liệu thu nhập nào trong khoảng thời gian này.</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default FinancialCharts;