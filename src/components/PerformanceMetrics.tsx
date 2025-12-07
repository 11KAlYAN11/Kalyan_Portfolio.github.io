import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, TrendingUp, Zap } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Activity: <Activity size={20} />,
  Clock: <Clock size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  Zap: <Zap size={20} />,
};

interface MetricConfig {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon: string;
  color: string;
  displayAsK?: boolean;
}

interface MetricsData {
  metrics: MetricConfig[];
}

interface Metric {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  color: string;
}

const PerformanceMetrics = () => {
  const [metricsData, setMetricsData] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const finalValues = useRef<number[]>([]);

  useEffect(() => {
    fetch('/config/metrics.json')
      .then(res => res.json())
      .then((data: MetricsData) => {
        finalValues.current = data.metrics.map(m => m.value);
        const initialMetrics = data.metrics.map(metric => ({
          id: metric.id,
          label: metric.label,
          value: 0,
          suffix: metric.suffix,
          icon: iconMap[metric.icon] || iconMap.Activity,
          color: metric.color
        }));
        setMetricsData(initialMetrics);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading metrics config:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!hasAnimated) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setHasAnimated(true);
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: '0px 0px -100px 0px'
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    }
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const easeOutExpoSlow = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * 0.3;
    };

    const duration = 3500;
    const steps = 200;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = easeOutExpoSlow(progress);

      setMetricsData(prevMetrics =>
        prevMetrics.map((metric, index) => {
          const targetValue = finalValues.current[index];
          let currentValue;
          let newSuffix = metric.suffix;
          
          if (index === 3) {
            const rawValue = targetValue * easedProgress;
            if (rawValue < 999) {
              currentValue = Math.floor(rawValue);
              newSuffix = '';
            } else {
              currentValue = 1;
              newSuffix = 'K+';
            }
          } else if (targetValue <= 5) {
            const rawValue = targetValue * easedProgress;
            if (rawValue < 0.5) {
              currentValue = 0;
            } else if (rawValue < 1.5) {
              currentValue = 1;
            } else if (rawValue < 2.5) {
              currentValue = 2;
            } else {
              currentValue = Math.round(rawValue);
            }
          } else {
            currentValue = Math.floor(targetValue * easedProgress);
          }

          return { ...metric, value: currentValue, suffix: newSuffix };
        })
      );

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [hasAnimated]);

  if (loading) {
    return (
      <div ref={sectionRef} className="py-20 text-center text-gray-400">
        Loading metrics...
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="py-16 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {metricsData.map((metric, index) => (
            <motion.div
              key={metric.id}
              className="text-center relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className={`absolute inset-0 rounded-xl bg-gradient-to-r ${metric.color} opacity-0 blur-xl group-hover:opacity-20`}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0, 0.15, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: index * 0.5
                }}
              />

              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r ${metric.color} text-white shadow-lg relative z-10`}
                whileHover={{ 
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                  scale: 1.1
                }}
                animate={hasAnimated ? {
                  boxShadow: [
                    "0 4px 15px rgba(0,0,0,0.1)",
                    "0 8px 30px rgba(59, 130, 246, 0.3)",
                    "0 4px 15px rgba(0,0,0,0.1)"
                  ]
                } : {}}
              >
                <motion.div
                  animate={hasAnimated ? {
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ 
                    duration: 2, 
                    delay: index * 0.2,
                    ease: "easeInOut" 
                  }}
                >
                  {metric.icon}
                </motion.div>
              </motion.div>
              
              <motion.div
                className="text-3xl md:text-4xl font-bold text-white mb-2 font-mono tracking-wide"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                {metric.value}{metric.suffix}
              </motion.div>
              
              <div className="text-gray-400 text-sm md:text-base font-medium group-hover:text-gray-300 transition-colors">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PerformanceMetrics;
