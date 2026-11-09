const OverviewCard = ({ title, total, success, error, children, inlineChildren = false }) => (
  <div className="bg-white p-4 rounded-lg shadow flex flex-col justify-between h-full">
    <h3 className="text-gray-500 text-sm font-poppins mb-2">{title}</h3>
    {inlineChildren ? (
      <div className="flex items-start mb-4 w-full">
        <div className="flex flex-col space-y-1 mr-4 mt-1 w-full">
          {/* <div className="flex flex-row my-auto">
            <p className="text-4xl font-bold font-poppins mr-4 my-auto">{total}</p>
            <div className="flex flex-col">
              <span className="flex items-center text-green-600 font-semibold">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Success: {success}
              </span>
              <span className="flex items-center text-red-600 font-semibold">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Errors: {error}
              </span>
            </div>
          </div> */}
          <div className="flex flex-col w-full">{children}</div>
        </div>
      </div>
    ) : (
      <div className="flex items-center mb-4">
        <p className="text-4xl font-bold font-poppins mr-4">{total}</p>
        <div className="flex flex-col space-y-1">
          <span className="flex items-center text-green-600 font-semibold">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Success: {success}
          </span>
          <span className="flex items-center text-red-600 font-semibold">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
            Errors: {error}
          </span>
        </div>
      </div>
    )}
    {!inlineChildren && children}
  </div>
);

export default OverviewCard;
